/**
 * @fileoverview Воркеры на машине исполнителя: запуск worker.py по команде панели
 * и пересылка его вывода обратно событиями. Для start_bot со сборкой код скачивается
 * в локальный кеш, и в команду подставляется путь к нему.
 * @module server/runner/runnerWorkers
 */

import { LocalWorkerChannel } from "../bots/localWorkerChannel";
import type { RunnerCommand, RunnerEvent } from "../redis/workerStreams";
import type { RunnerConfig } from "./runnerConfig";
import { fetchBuildOverHttp, pruneBuildCache, type FetchBuild } from "./runnerBuildCache";
import { prepareWorkerLine } from "./runnerStartCommand";
import { botFailedEvents, forwardWorkerEvents, stopWorker } from "./runnerWorkerEvents";

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
}

/**
 * Воркеры исполнителя по ключу воркера панели
 */
export class RunnerWorkers {
  /** Ключ воркера → запущенный воркер */
  private readonly workers = new Map<string, RunnerWorker>();

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
  handle(fields: Record<string, string>): void {
    const command = fields as unknown as RunnerCommand;
    if (command.k === "reset") return this.reset();
    if (!command.w || !command.i) return;
    if (command.k === "spawn") this.spawn(command.w, command.i);
    else if (command.k === "line" && command.l !== undefined) this.forward(command.w, command.i, command.l);
    else if (command.k === "kill") this.kill(command.w, command.i);
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
    this.workers.get(workerKey)?.channel.kill();
    console.log(`🛰️ Воркер ${workerKey} запускается (${instance.slice(0, 8)})`);
    const channel = new LocalWorkerChannel({
      command: this.config.pythonPath,
      args: ["-u", this.config.workerScript],
      env: { ...process.env, PROJECT_ID: workerKey, WORKER_REPORT_MEMORY: "true" },
    });
    this.workers.set(workerKey, { instance, channel, queue: Promise.resolve(), builds: new Map() });
    forwardWorkerEvents(channel, { w: workerKey, i: instance }, this.emitEvent, () => {
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
  private forward(workerKey: string, instance: string, line: string): void {
    const worker = this.current(workerKey, instance);
    if (!worker) return;
    worker.queue = worker.queue
      .then(() => prepareWorkerLine(line, this.config.cacheDir, this.fetchBuild))
      .then((prepared) => {
        if ("error" in prepared) {
          console.error(`🛰️ Воркер ${workerKey}, бот ${prepared.tokenId}: ${prepared.error}`);
          botFailedEvents({ w: workerKey, i: instance }, prepared.tokenId, prepared.error).forEach(this.emitEvent);
          return;
        }
        if (prepared.fingerprint && prepared.tokenId !== undefined) {
          worker.builds.set(prepared.tokenId, prepared.fingerprint);
          const inUse = new Set([...this.workers.values()].flatMap((w) => [...w.builds.values()]));
          void pruneBuildCache(this.config.cacheDir, this.config.buildsKeep, inUse).catch(() => undefined);
        }
        worker.channel.send(prepared.line);
      })
      .catch((error) => console.error(`🛰️ Воркер ${workerKey}: ошибка подготовки команды:`, error));
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
}
