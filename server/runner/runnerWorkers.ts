/**
 * @fileoverview Воркеры на машине исполнителя: запуск worker.py по команде панели
 * и пересылка его вывода обратно событиями. Для start_bot со сборкой код скачивается
 * в локальный кеш, и в команду подставляется путь к нему.
 * @module server/runner/runnerWorkers
 */

import { LocalWorkerChannel } from "../bots/localWorkerChannel";
import { buildWorkerBaseEnv } from "../bots/workerBaseEnv";
import type { RunnerCommand, RunnerEvent } from "../redis/workerStreams";
import type { RunnerConfig } from "./runnerConfig";
import { fetchBuildOverHttp, pruneBuildCache, type FetchBuild } from "./runnerBuildCache";
import { prepareWorkerLine } from "./runnerStartCommand";
import { botFailedEvents, forwardWorkerEvents, stopWorker } from "./runnerWorkerEvents";
import { parseWorkerSystemMessage } from "../bots/parseWorkerSystemMessage";

/** Снимок одного процесса воркера */
export interface RunnerWorkerSnapshot {
  /** Ключ воркера */
  workerKey: number;
  /** ID процесса, назначенный панелью */
  instance: string;
  /** Боты с подтверждённым запуском */
  tokenIds: number[];
  /** Боты, команда запуска которых ещё обрабатывается */
  pendingTokenIds: number[];
}

/** Снимок состояния исполнителя */
export interface RunnerSnapshot {
  /** Работающие процессы воркеров */
  workers: RunnerWorkerSnapshot[];
}

/** Сколько ждать штатного завершения воркеров при остановке исполнителя (мс) */
const SHUTDOWN_GRACE_MS = 5_000;

/** Запущенный воркер */
interface RunnerWorker {
  /** ID экземпляра от панели */
  instance: string;
  /** Процесс worker.py */
  channel: LocalWorkerChannel;
  /** Очередь строк в stdin: подготовка сборки не должна менять порядок команд */
  queue: Promise<void>;
  /** Отпечатки сборок запущенных ботов: tokenId → отпечаток (не удаляются из кеша) */
  builds: Map<number, string>;
  /** Боты, подтвердившие запуск */
  tokenIds: Set<number>;
  /** Запуски, для которых ещё нет подтверждения bot_started */
  pendingTokenIds: Set<number>;
}

/**
 * Воркеры исполнителя по ключу воркера панели
 */
export class RunnerWorkers {
  /** Ключ воркера → запущенный воркер */
  private readonly workers = new Map<string, RunnerWorker>();
  /** Команды, уже выполненные в этом процессе до подтверждения Redis */
  private readonly handledCommands = new Set<string>();

  /**
   * @param config - Настройки исполнителя
   * @param emitEvent - Отправка события панели
   * @param fetchBuild - Скачивание сборки (подменяется в тестах)
   */
  constructor(
    private readonly config: RunnerConfig,
    private readonly emitEvent: (event: RunnerEvent) => void,
    private readonly fetchBuild: FetchBuild = fetchBuildOverHttp,
  ) {}

  /** Число запущенных воркеров */
  get size(): number {
    return this.workers.size;
  }

  /**
   * Выполняет команду панели
   * @param fields - Поля записи потока команд
   */
  async handle(fields: Record<string, string>): Promise<void> {
    const id = fields.__id;
    if (id && this.handledCommands.has(id)) return;
    await this.perform(fields);
    if (id) {
      this.handledCommands.add(id);
      if (this.handledCommands.size > 10_000) this.handledCommands.delete(this.handledCommands.values().next().value!);
    }
  }

  /**
   * Выполняет команду после проверки повторной доставки
   * @param fields - Поля команды
   */
  private async perform(fields: Record<string, string>): Promise<void> {
    const command = fields as unknown as RunnerCommand;
    if (command.k === "reset") return this.reset();
    if (command.k === "ping") return this.emitEvent({ k: "pong", w: "", i: "" });
    if (command.k === "inspect" && command.q) {
      this.emitEvent({ k: "snapshot", w: "", i: "", q: command.q, d: JSON.stringify(this.snapshot()) });
      return;
    }
    if (!command.w || !command.i) return;
    if (command.k === "spawn") this.spawn(command.w, command.i);
    else if (command.k === "line" && command.l !== undefined) await this.forward(command.w, command.i, command.l);
    else if (command.k === "kill") this.kill(command.w, command.i);
  }

  /**
   * Возвращает подтверждённые состояния воркеров для переподключившейся панели
   * @returns Снимок процессов и ботов
   */
  snapshot(): RunnerSnapshot {
    return { workers: [...this.workers].map(([workerKey, worker]) => ({
      workerKey: Number(workerKey), instance: worker.instance, tokenIds: [...worker.tokenIds],
      pendingTokenIds: [...worker.pendingTokenIds],
    })) };
  }

  /**
   * Воркер ключа, если это нужный экземпляр
   * @param workerKey - Ключ воркера
   * @param instance - ID экземпляра
   * @returns воркер или undefined для устаревшего экземпляра
   */
  private current(workerKey: string, instance: string): RunnerWorker | undefined {
    const worker = this.workers.get(workerKey);
    return worker?.instance === instance ? worker : undefined;
  }

  /**
   * Запускает worker.py; старый воркер с тем же ключом убивается
   * @param workerKey - Ключ воркера
   * @param instance - ID экземпляра
   */
  private spawn(workerKey: string, instance: string): void {
    if (this.current(workerKey, instance)) return;
    this.workers.get(workerKey)?.channel.kill();
    console.log(`🛰️ Воркер ${workerKey} запускается (${instance.slice(0, 8)})`);
    const channel = new LocalWorkerChannel({
      command: this.config.pythonPath,
      args: ["-u", this.config.workerScript],
      env: { ...buildWorkerBaseEnv(process.env, { includeConnections: false }), PROJECT_ID: workerKey, WORKER_REPORT_MEMORY: "true" },
    });
    const worker: RunnerWorker = {
      instance, channel, queue: Promise.resolve(), builds: new Map(), tokenIds: new Set(), pendingTokenIds: new Set(),
    };
    this.workers.set(workerKey, worker);
    forwardWorkerEvents(channel, { w: workerKey, i: instance }, (event) => {
      if (event.k === "line" && event.l) {
        try {
          const message = JSON.parse(event.l);
          if (message.type === "system") {
            const parsed = parseWorkerSystemMessage(message.content);
            if (parsed.kind === "bot_started" && parsed.tokenId !== undefined) {
              worker.pendingTokenIds.delete(parsed.tokenId);
              worker.tokenIds.add(parsed.tokenId);
            }
            if ((parsed.kind === "bot_exited" || parsed.kind === "bot_stopped") && parsed.tokenId !== undefined) {
              worker.pendingTokenIds.delete(parsed.tokenId);
              worker.tokenIds.delete(parsed.tokenId);
            }
          }
        } catch { /* Вывод воркера может быть обычным текстом. */ }
      }
      this.emitEvent(event);
    }, () => {
      if (this.workers.get(workerKey)?.instance === instance) this.workers.delete(workerKey);
    });
  }

  /**
   * Ставит строку в очередь воркера. Для start_bot со сборкой код скачивается в кеш;
   * если не удалось — панель получает падение бота, как от самого воркера
   * @param workerKey - Ключ воркера
   * @param instance - ID экземпляра
   * @param line - Строка JSON от панели
   */
  private async forward(workerKey: string, instance: string, line: string): Promise<void> {
    const worker = this.current(workerKey, instance);
    if (!worker) return;
    const parsed = JSON.parse(line);
    if (parsed.cmd === "start_bot" || parsed.cmd === "stop_bot") {
      const fenced = Number.isSafeInteger(parsed.instance_id) && Number.isSafeInteger(parsed.desired_generation);
      if (!fenced && this.config.requireFence) {
        const reason = `нет версии намерения для ${parsed.cmd}`;
        if (parsed.cmd === "start_bot" && Number.isSafeInteger(parsed.token_id)) {
          botFailedEvents({ w: workerKey, i: instance }, parsed.token_id, reason).forEach(this.emitEvent);
        }
        console.error(`🛰️ ${reason}`);
        return;
      }
      if (this.config.requireFence && fenced && !await (await import("./runnerCommandFence")).isCurrentBotCommand(parsed, parsed.cmd)) {
        console.warn(`🛰️ Устаревшая команда ${parsed.cmd} для бота ${parsed.token_id} пропущена`);
        return;
      }
    }
    try {
      if (parsed.cmd === "start_bot" && Number.isSafeInteger(parsed.token_id)) worker.pendingTokenIds.add(parsed.token_id);
      if (parsed.cmd === "stop_bot" && Number.isSafeInteger(parsed.token_id)) worker.pendingTokenIds.delete(parsed.token_id);
    } catch { /* Неизвестную строку обработает Python-воркер. */ }
    worker.queue = worker.queue
      .then(() => prepareWorkerLine(line, this.config.cacheDir, this.fetchBuild))
      .then(async (prepared) => {
        if ("error" in prepared) {
          worker.pendingTokenIds.delete(prepared.tokenId);
          console.error(`🛰️ Воркер ${workerKey}, бот ${prepared.tokenId}: ${prepared.error}`);
          botFailedEvents({ w: workerKey, i: instance }, prepared.tokenId, prepared.error).forEach(this.emitEvent);
          return;
        }
        if (prepared.fingerprint && prepared.tokenId !== undefined) {
          worker.builds.set(prepared.tokenId, prepared.fingerprint);
          const inUse = new Set([...this.workers.values()].flatMap((w) => [...w.builds.values()]));
          void pruneBuildCache(this.config.cacheDir, this.config.buildsKeep, inUse).catch(() => undefined);
        }
        if (this.config.requireFence && (parsed.cmd === "start_bot" || parsed.cmd === "stop_bot")
          && Number.isSafeInteger(parsed.instance_id) && Number.isSafeInteger(parsed.desired_generation)) {
          const current = await import("./runnerCommandFence").then(({ isCurrentBotCommand }) =>
            isCurrentBotCommand(parsed, parsed.cmd));
          if (!current) {
            worker.pendingTokenIds.delete(parsed.token_id);
            console.warn(`🛰️ Команда ${parsed.cmd} устарела во время подготовки и пропущена`);
            return;
          }
        }
        if (!worker.channel.send(prepared.line)) throw new Error(`воркер ${workerKey} завершился до доставки команды`);
      })
      .catch((error) => {
        console.error(`🛰️ Воркер ${workerKey}: ошибка подготовки команды:`, error);
        try {
          const command = JSON.parse(line);
          if (command.cmd === "start_bot" && Number.isSafeInteger(command.token_id)) {
            worker.pendingTokenIds.delete(command.token_id);
            botFailedEvents({ w: workerKey, i: instance }, command.token_id, String(error)).forEach(this.emitEvent);
            return;
          }
        } catch { /* Неразбираемая команда остаётся без подтверждения. */ }
        throw error;
      });
    await worker.queue;
  }

  /**
   * Убивает воркер; если его уже нет — сразу сообщает панели о завершении
   * @param workerKey - Ключ воркера
   * @param instance - ID экземпляра
   */
  private kill(workerKey: string, instance: string): void {
    const worker = this.current(workerKey, instance);
    if (worker) worker.channel.kill();
    else this.emitEvent({ w: workerKey, i: instance, k: "exit", s: "SIGKILL" });
  }

  /** Убивает все воркеры (панель перезапустилась и не знает о них) */
  private reset(): void {
    if (this.workers.size > 0) console.log(`🛰️ Сброс от панели: убиваем воркеры (${this.workers.size})`);
    for (const worker of this.workers.values()) worker.channel.kill();
  }

  /**
   * Штатно останавливает все воркеры, по таймауту — убивает
   * @returns промис после завершения всех воркеров
   */
  async shutdown(): Promise<void> {
    await Promise.all([...this.workers.values()].map(({ channel }) => stopWorker(channel, SHUTDOWN_GRACE_MS)));
  }

  /** Немедленно останавливает процессы после потери аренды. */
  killAll(): void {
    for (const worker of this.workers.values()) worker.channel.kill();
  }
}
