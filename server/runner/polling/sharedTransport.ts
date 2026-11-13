/** @fileoverview Общий канал Python: ограниченный протокол, очистка секретов и последовательная запись stdin. */
import { spawn } from "node:child_process";
import { boundedLines, childEnvironment, killChildTree, redactChildEvent, redactChildLog } from "./pythonChildSupport";

/** Настройки общего процесса без секретов в аргументах. */
export interface SharedTransportOptions {
  /** Исполняемый интерпретатор. */
  command: string;
  /** Безопасные аргументы запуска. */
  args: string[];
  /** Техническое окружение. */
  env: NodeJS.ProcessEnv;
  /** Получатель событий. */
  onEvent(event: Record<string, unknown>): void;
  /** Получатель очищенных непредвиденных строк. */
  onLog?(text: string): void;
}

/** Поддерживает одно дерево процесса и ограничивает записи, ожидающие освобождения stdin. */
export class SharedPythonTransport {
  /** Единственный принадлежащий каналу процесс. */
  private readonly child;
  /** Значения секретов всех регистраций, не публикуемые в диагностике. */
  private readonly secrets = new Map<string, Set<string>>();
  /** Возвращает секреты только незавершённых активаций. */
  private activeSecrets(): string[] { return [...this.secrets.values()].flatMap(values => [...values]); }
  /** Последовательная запись с ожиданием передачи в канал ОС. */
  private writing: Promise<void> = Promise.resolve();
  /** Число ещё не переданных байтов. */
  private pendingBytes = 0;
  /** Подтверждение запуска общего интерпретатора. */
  readonly ready: Promise<void>;
  /** Завершение всего общего процесса. */
  readonly done: Promise<{ code: number | null; signal: string | null }>;

  /** Подписывает потоки до отправки начальной команды. */
  constructor(private readonly options: SharedTransportOptions) {
    this.child = spawn(options.command, options.args, { env: childEnvironment(options.env),
      stdio: ["pipe", "pipe", "pipe"], windowsHide: true, detached: process.platform !== "win32" });
    let resolveReady!: () => void;
    let rejectReady!: (error: Error) => void;
    this.ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
    this.done = new Promise(resolve => {
      this.child.once("error", () => { rejectReady(new Error("Не удалось запустить общий обработчик")); resolve({ code: null, signal: null }); });
      this.child.once("exit", (code, signal) => {
        rejectReady(new Error("Общий обработчик завершился до готовности")); resolve({ code, signal });
        if (process.platform !== "win32") this.kill();
      });
    });
    const timer = setTimeout(() => { rejectReady(new Error("Истекло ожидание общего обработчика")); this.kill(); }, 60_000);
    void this.ready.then(() => clearTimeout(timer), () => clearTimeout(timer));
    this.child.stdin.on("error", () => { rejectReady(new Error("Канал общего обработчика закрыт")); this.kill(); });
    const stdout = boundedLines(text => {
      let event: Record<string, unknown>;
      try { event = JSON.parse(text); } catch { options.onLog?.(redactChildLog(text, this.activeSecrets())); return; }
      if (!event || typeof event !== "object" || Array.isArray(event)) return;
      if (event.type === "process" && event.event === "ready" && !event.activation_id) resolveReady();
      const cleaned = redactChildEvent(event, this.activeSecrets()) as Record<string, unknown>;
      // Метаданные известного запуска не являются текстом лога: их очистка ломает маршрутизацию.
      if (this.secrets.has(String(event.activation_id))) cleaned.activation_id = event.activation_id;
      if (["process", "stdout", "stderr", "system"].includes(String(event.type))) cleaned.type = event.type;
      /** Числовые события жизненного цикла сохраняют формат даже при коротком секрете в окружении. */
      if (event.type === "system" && typeof event.content === "string"
        && /^(?:worker_ready|memory_kb:\d+|bot_(?:started|stopped):\d+|bot_exited:\d+:(?:error|stopped|0))$/.test(event.content))
        cleaned.content = event.content;
      if (event.type === "process" && ["ready", "exited", "error", "idle", "memory", "startup_timing"].includes(String(event.event)))
        cleaned.event = event.event;
      options.onEvent(cleaned);
      if (event.type === "process" && event.event === "exited") this.secrets.delete(String(event.activation_id));
      /** Постоянный бот освобождает секреты только после очистки его последнего события. */
      if (event.type === "system" && typeof event.content === "string") {
        const ended = /^bot_(?:stopped|exited):(\d+)(?::|$)/.exec(event.content);
        if (ended) this.secrets.delete(`permanent:${ended[1]}`);
      }
    });
    const stderr = boundedLines(text => options.onLog?.(redactChildLog(text, this.activeSecrets())));
    for (const [stream, parser] of [[this.child.stdout, stdout], [this.child.stderr, stderr]] as const) {
      stream.setEncoding("utf8");
      stream.on("data", (chunk: string) => { try { parser(chunk); } catch { this.kill(); } });
    }
    void this.send({ cmd: "init" }).catch(() => this.kill());
  }

  /** Возвращает PID запущенного дерева. */
  get pid(): number | undefined { return this.child.pid; }

  /** Передаёт секреты только через ограниченный stdin и сохраняет порядок команд. */
  send(command: Record<string, unknown>): Promise<void> {
    const payload = JSON.stringify(command) + "\n";
    const bytes = Buffer.byteLength(payload);
    if (bytes > 1024 * 1024 || this.pendingBytes + bytes > 4 * 1024 * 1024) {
      return Promise.reject(new Error("Превышен размер очереди общего обработчика"));
    }
    const secrets = new Set<string>();
    if (typeof command.token === "string") secrets.add(command.token);
    for (const [key, value] of Object.entries((command.env ?? {}) as Record<string, unknown>)) {
      if (/TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH|(?:^|_)KEY(?:$|_)|(?:DATABASE|REDIS)_URL/i.test(key)
        && typeof value === "string") secrets.add(value);
    }
    if (command.cmd === "start") this.secrets.set(String(command.activation_id), secrets);
    /** У каждого постоянного бота собственный ключ: новая регистрация не снимает маскировку соседей. */
    if (command.cmd === "start_bot") this.secrets.set(`permanent:${command.token_id}`, secrets);
    if ([this.options.command, ...this.options.args].some(arg => this.activeSecrets().some(secret => secret && arg.includes(secret)))) {
      return Promise.reject(new Error("Секрет запрещён в аргументах общего обработчика"));
    }
    this.pendingBytes += bytes;
    const writing = this.writing.then(() => new Promise<void>((resolve, reject) => {
      if (this.child.stdin.destroyed) { reject(new Error("Канал общего обработчика закрыт")); return; }
      this.child.stdin.write(payload, error => error ? reject(new Error("Ошибка записи общего обработчика")) : resolve());
    }));
    this.writing = writing.catch(() => {});
    return writing.finally(() => { this.pendingBytes -= bytes; });
  }

  /** Управляет обратным давлением обоих выходных потоков. */
  pauseOutput(paused: boolean): void {
    for (const stream of [this.child.stdout, this.child.stderr]) paused ? stream.pause() : stream.resume();
  }

  /** Завершает только принадлежащее каналу дерево. */
  kill(): void { void killChildTree(this.child).catch(() => {}); }

  /** Дожидается остановки процесса, ограничивая зависание общего завершения. */
  async shutdown(): Promise<void> {
    this.pauseOutput(false);
    const timer = setTimeout(() => this.kill(), 10_000);
    try { await this.send({ cmd: "shutdown" }).catch(() => this.kill()); await this.done; }
    finally { clearTimeout(timer); }
  }
}
