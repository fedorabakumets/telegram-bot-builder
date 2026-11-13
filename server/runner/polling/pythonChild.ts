/** @fileoverview Запуск временного Python-обработчика с секретами через stdin и ограниченным временем остановки. */
import { isSecretEnvironmentKey } from "../../utils/secret-environment-key";
import { spawn } from "node:child_process";
import { boundedLines, childEnvironment, killChildTree, redactChildEvent, redactChildLog } from "./pythonChildSupport";

/** Параметры запуска одного обработчика. */
export interface PythonPollingChildOptions {
  /** Исполняемый файл интерпретатора. */
  command: string;
  /** Аргументы без токенов и других секретов. */
  args: string[];
  /** Исходное окружение, очищаемое перед запуском. */
  env: NodeJS.ProcessEnv;
  /** Начальная конфигурация, передаваемая только через stdin. */
  init: Record<string, unknown>;
  /** Получатель событий протокола. */
  onEvent?: (event: Record<string, unknown>) => void;
  /** Получатель очищенных диагностических строк. */
  onLog?: (text: string) => void;
  /** Максимальное ожидание готовности. */
  readyTimeoutMs?: number;
  /** Максимальное ожидание штатной остановки. */
  stopTimeoutMs?: number;
  /** Отмена запуска или работы. */
  signal?: AbortSignal;
}

/** Управление временем жизни одного Python-обработчика. */
export interface PythonPollingChild {
  /** PID непосредственно запущенного процесса. */
  readonly pid: number | undefined;
  /** PID интерпретатора из сообщения готовности. */
  readonly actualPid: number | undefined;
  /** Завершение дочернего процесса. */
  done: Promise<{ code: number | null; signal: string | null }>;
  /** Штатная остановка с принудительным завершением по таймеру. */
  stop(): Promise<void>;
  /** Передаёт обратное давление чтению stdout и stderr реального процесса. */
  pauseOutput(paused: boolean): void;
  /** Немедленно завершает принадлежащее исполнителю дерево процессов. */
  kill(): void;
}

/** Запускает обработчик и возвращает управление только после подтверждения готовности. */
export async function startPythonPollingChild(options: PythonPollingChildOptions): Promise<PythonPollingChild> {
  if (options.signal?.aborted) throw new Error("Запуск обработчика отменён");
  const secretEnv = Object.entries((options.init.env ?? {}) as Record<string, unknown>)
    .filter(([key]) => isSecretEnvironmentKey(key));
  const secrets = [options.init.token, ...secretEnv.map(([, value]) => value)]
    .filter((value): value is string => typeof value === "string");
  const token = options.init.token;
  if (typeof token === "string" && token && [options.command, ...options.args].some((value) => value.includes(token))) {
    throw new Error("Секрет запрещён в аргументах обработчика");
  }
  const payload = JSON.stringify(options.init) + "\n";
  if (Buffer.byteLength(payload) > 1024 * 1024 - 1) throw new Error("Слишком большая конфигурация обработчика");
  const child = spawn(options.command, options.args, { env: childEnvironment(options.env),
    stdio: ["pipe", "pipe", "pipe"], detached: process.platform !== "win32", windowsHide: true });
  let actualPid: number | undefined;
  let stopping: Promise<void> | undefined;
  let readyResolve!: () => void;
  let readyReject!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const done = new Promise<{ code: number | null; signal: string | null }>((resolve) => {
    child.once("error", () => { readyReject(new Error("Не удалось запустить обработчик")); resolve({ code: null, signal: null }); });
    child.once("exit", (code, signal) => {
      if (process.platform !== "win32") void killChildTree(child);
      readyReject(new Error("Обработчик завершился до готовности")); resolve({ code, signal });
    });
  });
  /** Запрашивает остановку и обязательно дожидается завершения процесса. */
  const stop = (): Promise<void> => stopping ??= (async () => {
    const timer = setTimeout(() => { void killChildTree(child); }, options.stopTimeoutMs ?? 10_000);
    try { if (!child.stdin.destroyed) child.stdin.end('{"cmd":"stop"}\n'); await done; }
    finally { clearTimeout(timer); }
  })();
  /** Останавливает либо возобновляет чтение обоих потоков без отбрасывания данных. */
  const pauseOutput = (paused: boolean): void => {
    for (const output of [child.stdout, child.stderr]) {
      if (paused) output.pause(); else output.resume();
    }
  };
  /** Принудительно завершает собственное дерево, не оставляя необработанный отказ. */
  const kill = (): void => { void killChildTree(child).catch(() => {}); };
  /** Обрабатывает строку протокола без публикации исходных секретов. */
  const line = boundedLines((text) => {
    try {
      const event = JSON.parse(text);
      if (!event || typeof event !== "object" || Array.isArray(event)) return;
      if (event.type === "process" && event.event === "ready") {
        if (Number.isSafeInteger(event.pid) && event.pid > 0) actualPid = event.pid;
        readyResolve();
      }
      options.onEvent?.(redactChildEvent(event, secrets) as Record<string, unknown>);
    } catch { options.onLog?.(redactChildLog(text, secrets)); }
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  const stderr = boundedLines((text) => options.onLog?.(redactChildLog(text, secrets)));
  /** Останавливает процесс при нарушении ограничения вывода. */
  const consume = (parser: (chunk: string) => void, chunk: string) => {
    try { parser(chunk); } catch { readyReject(new Error("Некорректный вывод обработчика")); void stop(); }
  };
  child.stdout.on("data", (chunk: string) => consume(line, chunk));
  child.stderr.on("data", (chunk: string) => consume(stderr, chunk));
  child.stdin.on("error", () => { readyReject(new Error("Канал конфигурации обработчика закрыт")); void stop(); });
  const abort = () => { readyReject(new Error("Запуск обработчика отменён")); void stop(); };
  options.signal?.addEventListener("abort", abort, { once: true });
  void done.then(() => options.signal?.removeEventListener("abort", abort));
  const timeout = setTimeout(() => readyReject(new Error("Истекло ожидание готовности обработчика")), options.readyTimeoutMs ?? 60_000);
  try {
    child.stdin.write(payload);
    await ready;
    return { pid: child.pid, get actualPid() { return actualPid; }, done, stop, pauseOutput, kill };
  } catch (error) { await stop(); throw error; }
  finally { clearTimeout(timeout); }
}
