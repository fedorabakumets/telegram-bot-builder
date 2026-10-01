/**
 * @fileoverview Воркеры на машине исполнителя: запуск worker.py по команде панели
 * и пересылка его вывода обратно событиями.
 * @module server/runner/runnerWorkers
 */

import { LocalWorkerChannel } from "../bots/localWorkerChannel";
import type { RunnerCommand, RunnerEvent } from "../redis/workerStreams";
import type { RunnerConfig } from "./runnerConfig";

/** Сколько ждать штатного завершения воркеров при остановке исполнителя (мс) */
const SHUTDOWN_GRACE_MS = 5_000;

/** Запущенный воркер */
interface RunnerWorker {
  /** ID экземпляра от панели */
  instance: string;
  /** Процесс worker.py */
  channel: LocalWorkerChannel;
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
   */
  constructor(
    private readonly config: RunnerConfig,
    private readonly emitEvent: (event: RunnerEvent) => void,
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
    else if (command.k === "line" && command.l !== undefined) this.current(command.w, command.i)?.channel.send(command.l);
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
    this.workers.set(workerKey, { instance, channel });
    const base = { w: workerKey, i: instance };
    channel.on("line", (line: string) => this.emitEvent({ ...base, k: "line", l: line }));
    channel.on("stderr", (text: string) => this.emitEvent({ ...base, k: "stderr", l: text }));
    channel.on("exit", (code: number | null, signal: string | null) => {
      if (this.workers.get(workerKey)?.instance === instance) this.workers.delete(workerKey);
      console.log(`🛰️ Воркер ${workerKey} завершился: code=${code}, signal=${signal}`);
      this.emitEvent({ ...base, k: "exit", c: code === null ? undefined : String(code), s: signal ?? undefined });
    });
    channel.on("error", (error: Error) => {
      if (this.workers.get(workerKey)?.instance === instance) this.workers.delete(workerKey);
      console.error(`🛰️ Воркер ${workerKey} не запустился: ${error.message}`);
      this.emitEvent({ ...base, k: "error", l: error.message });
    });
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
    const pending = [...this.workers.values()].map(
      ({ channel }) =>
        new Promise<void>((resolve) => {
          const timer = setTimeout(() => channel.kill(), SHUTDOWN_GRACE_MS);
          channel.once("exit", () => {
            clearTimeout(timer);
            resolve();
          });
          if (!channel.send(JSON.stringify({ cmd: "shutdown" }))) channel.kill();
        }),
    );
    await Promise.all(pending);
  }
}
