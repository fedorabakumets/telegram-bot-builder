/**
 * @fileoverview Воркеры на машине исполнителя: запуск worker.py по команде панели
 * и пересылка его вывода обратно событиями. Для start_bot со сборкой код скачивается
 * в локальный кеш, и в команду подставляется путь к нему.
 * @module server/runner/runnerWorkers
 */

import { RunnerWorkerExecution } from "./runnerWorkerExecution";
import type { RunnerCommand, RunnerEvent } from "../redis/workerStreams";
import type { RunnerConfig } from "./runnerConfig";
import { fetchBuildOverHttp, pruneBuildCache, type FetchBuild } from "./runnerBuildCache";
import { prepareWorkerLine } from "./runnerStartCommand";
import { botFailedEvents } from "./runnerWorkerEvents";
import { RunnerBuildPins } from "./runnerBuildPins";
import { RunnerCachePruner } from "./runnerCachePruner";
import { parseWorkerSystemMessage } from "../bots/parseWorkerSystemMessage";
import { pollingTimingMetrics } from "./polling/timingMetrics";
import { RunnerBotModes, type RunnerBotMode } from "./runnerBotModes";
import { RunnerRuntimeCounters } from "./runnerRuntimeCounters";

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
  /** Режимы отправленных запусков и доступная фактическая активность. */
  bots?: RunnerBotMode[];
  /** Фактические процессы и суммарная память Python внутри данной группы. */
  execution?: ReturnType<RunnerWorkerExecution["memoryCounters"]>;
  /** Последние безопасные счётчики постоянного Python с возрастом и признаком устарелости. */
  pythonCounters?: ReturnType<RunnerRuntimeCounters["snapshot"]>;
}

/** Снимок состояния исполнителя */
export interface RunnerSnapshot {
  /** Работающие процессы воркеров */
  workers: RunnerWorkerSnapshot[];
  /** Снимок процесса Node; память указана один раз на весь исполнитель. */
  runtime?: {
    /** Фактический приёмник обновлений после загрузки окружения. */
    processPolling: "node" | "python";
    /** Фактическая стратегия обработчиков process-ботов. */
    processHandler: "shared" | "isolated";
    /** PID процесса Node. */
    pid: number;
    /** RSS процесса Node в байтах. */
    nodeRssBytes: number;
    /** Время жизни процесса Node в секундах. */
    uptimeSeconds: number;
    /** Ограниченная выборка задержек пробуждения и обработки без пользовательских данных. */
    latency: ReturnType<typeof pollingTimingMetrics>;
  };
}

/** Запущенный воркер */
interface RunnerWorker {
  /** ID экземпляра от панели */
  instance: string;
  /** Реальные каналы выполнения логической группы. */
  channel: RunnerWorkerExecution;
  /** Очередь строк в stdin: подготовка сборки не должна менять порядок команд */
  queue: Promise<void>;
  /** Отпечатки сборок запущенных ботов: tokenId → отпечаток (не удаляются из кеша) */
  builds: RunnerBuildPins;
  /** Боты, подтвердившие запуск */
  tokenIds: Set<number>;
  /** Запуски, для которых ещё нет подтверждения bot_started */
  pendingTokenIds: Set<number>;
  /** Только безопасные настройки текущих запусков. */
  modes: RunnerBotModes;
  /** Ограниченная последняя выборка без пользовательских данных. */
  counters: RunnerRuntimeCounters;
}

/**
 * Воркеры исполнителя по ключу воркера панели
 */
export class RunnerWorkers {
  /** Ключ воркера → запущенный воркер */
  private readonly workers = new Map<string, RunnerWorker>();
  /** Команды, уже выполненные в этом процессе до подтверждения Redis */
  private readonly handledCommands = new Set<string>();
  /** Объединённая очистка, исключающая подготовку сборок во время удаления. */
  private readonly cachePruner: RunnerCachePruner;
  /** Нужно ли приостановить чтение вывода из-за давления очереди событий. */
  private outputPaused = false;

  /**
   * @param config - Настройки исполнителя
   * @param emitEvent - Отправка события панели
   * @param fetchBuild - Скачивание сборки (подменяется в тестах)
   */
  constructor(
    private readonly config: RunnerConfig,
    private readonly emitEvent: (event: RunnerEvent) => void,
    private readonly fetchBuild: FetchBuild = fetchBuildOverHttp,
  ) {
    this.cachePruner = new RunnerCachePruner(() => pruneBuildCache(config.cacheDir, config.buildsKeep,
      new Set([...this.workers.values()].flatMap((worker) => worker.builds.values()))));
  }

  /** Приостанавливает вывод всех каналов, сохраняя состояние для новых воркеров. */
  pauseOutput(paused: boolean): void {
    this.outputPaused = paused;
    for (const worker of this.workers.values()) worker.channel.pauseOutput(paused);
  }

  /** Число запущенных воркеров */
  get size(): number {
    return this.workers.size;
  }

  /** Сопоставляет PID с воркерами и показывает размеры служебных коллекций без токенов и команд. */
  memoryCounters() {
    return { handledCommands: this.handledCommands.size,
      workers: [...this.workers].map(([workerKey, worker]) => ({ workerKey, pid: worker.channel.pid,
        activeBots: worker.tokenIds.size, pendingBots: worker.pendingTokenIds.size,
        buildPins: worker.builds.size, ...worker.channel.memoryCounters() })) };
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
    return { runtime: { processPolling: this.config.processPolling ?? "python",
      processHandler: this.config.processHandler ?? "shared", pid: process.pid,
      nodeRssBytes: process.memoryUsage.rss(), uptimeSeconds: process.uptime(), latency: pollingTimingMetrics() },
      workers: [...this.workers].map(([workerKey, worker]) => ({
      workerKey: Number(workerKey), instance: worker.instance, tokenIds: [...worker.tokenIds],
      pendingTokenIds: [...worker.pendingTokenIds],
      bots: worker.modes.snapshot(worker.channel.memoryCounters().polling?.bots),
      execution: worker.channel.memoryCounters(),
      pythonCounters: worker.counters.snapshot(),
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
   * Создаёт группу выполнения; старый экземпляр останавливается, Python может запускаться лениво.
   * @param workerKey - Ключ воркера
   * @param instance - ID экземпляра
   */
  private spawn(workerKey: string, instance: string): void {
    if (this.current(workerKey, instance)) return;
    this.workers.get(workerKey)?.channel.kill();
    console.log(`🛰️ Воркер ${workerKey} запускается (${instance.slice(0, 8)})`);
    const channel = new RunnerWorkerExecution(this.config, { w: workerKey, i: instance }, (event) => {
      if (event.k === "line" && event.l) {
        try {
          const message = JSON.parse(event.l);
          if (worker.counters.ingest(message, Date.now(), event.l.length)) return;
          /** Профиль памяти остаётся в журнале runtime и не нагружает Redis или терминалы ботов. */
          if (message.type === "worker_memory_profile") {
            console.log(JSON.stringify({ ...message, workerKey, instance }));
            return;
          }
          if (message.type === "system") {
            worker.modes.observe(message.content);
            const parsed = parseWorkerSystemMessage(message.content);
            if (parsed.kind === "bot_started" && parsed.tokenId !== undefined) {
              worker.builds.started(parsed.tokenId);
              worker.pendingTokenIds.delete(parsed.tokenId);
              worker.tokenIds.add(parsed.tokenId);
            }
            if ((parsed.kind === "bot_exited" || parsed.kind === "bot_stopped") && parsed.tokenId !== undefined) {
              worker.builds.stopped(parsed.tokenId, parsed.status === "error");
              this.cachePruner.request();
              if (parsed.status === "error") worker.pendingTokenIds.delete(parsed.tokenId);
              worker.tokenIds.delete(parsed.tokenId);
            }
          }
        } catch { /* Вывод воркера может быть обычным текстом. */ }
      }
      this.emitEvent(event);
    }, () => {
      if (this.workers.get(workerKey)?.instance === instance) {
        this.workers.delete(workerKey);
        this.cachePruner.request();
      }
    });
    const worker: RunnerWorker = {
      instance, channel, queue: Promise.resolve(), builds: new RunnerBuildPins(), tokenIds: new Set(), pendingTokenIds: new Set(), modes: new RunnerBotModes(), counters: new RunnerRuntimeCounters(),
    };
    channel.pauseOutput(this.outputPaused);
    this.workers.set(workerKey, worker);
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
      .then(() => this.cachePruner.protect(async () => {
        const prepared = await prepareWorkerLine(line, this.config.cacheDir, this.fetchBuild);
        if ("error" in prepared) {
          worker.pendingTokenIds.delete(prepared.tokenId);
          console.error(`🛰️ Воркер ${workerKey}, бот ${prepared.tokenId}: ${prepared.error}`);
          botFailedEvents({ w: workerKey, i: instance }, prepared.tokenId, prepared.error).forEach(this.emitEvent);
          return;
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
        if (prepared.fingerprint && prepared.tokenId !== undefined) worker.builds.prepare(prepared.tokenId, prepared.fingerprint);
        if (this.current(workerKey, instance) !== worker) return;
        await worker.channel.sendAsync(prepared.line);
        if (parsed.cmd === "start_bot" && (worker.pendingTokenIds.has(parsed.token_id) || worker.tokenIds.has(parsed.token_id))) {
          worker.modes.start(JSON.parse(prepared.line));
          if (worker.tokenIds.has(parsed.token_id)) worker.modes.observe(`bot_started:${parsed.token_id}`);
        }
      }))
      .catch((error) => {
        console.error(`🛰️ Воркер ${workerKey}: ошибка подготовки команды:`, error);
        try {
          const command = JSON.parse(line);
          if (command.cmd === "start_bot" && Number.isSafeInteger(command.token_id)) {
            worker.modes.remove(command.token_id);
            worker.pendingTokenIds.delete(command.token_id);
            worker.builds.stopped(command.token_id, true);
            this.cachePruner.request();
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
    this.cachePruner.cancel();
    await Promise.all([...this.workers.values()].map(({ channel }) => channel.shutdown()));
  }

  /** Немедленно останавливает процессы после потери аренды. */
  killAll(): void {
    for (const worker of this.workers.values()) worker.channel.kill();
  }
}
