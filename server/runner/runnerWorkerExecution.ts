/** @fileoverview Координатор логической группы: ленивый старый воркер и Node-приёмники process. */
import { LocalWorkerChannel } from "../bots/localWorkerChannel";
import { buildWorkerBaseEnv } from "../bots/workerBaseEnv";
import type { RunnerEvent } from "../redis/workerStreams";
import type { RunnerConfig } from "./runnerConfig";
import { forwardWorkerEvents, stopWorker } from "./runnerWorkerEvents";
import { ProcessPollingRuntime } from "./polling/factory";
import { processPollingBot, usesNodePolling, type ProcessStartCommand } from "./polling/runtimeSettings";
import { validateProcessBuild } from "./polling/validateBuild";
import { RunnerLegacyRoutes } from "./runnerLegacyRoutes";
import { SharedPollingHost } from "./polling/sharedHost";
import { RunnerMemoryTotals } from "./runnerMemoryTotals";

/** Разделяет маршруты выполнения без выдачи виртуальной группы за Python-процесс. */
export class RunnerWorkerExecution {
  /** Старый общий Python запускается только при необходимости. */
  private legacy?: LocalWorkerChannel;
  /** Единый физический владелец постоянных и временных сценариев. */
  private readonly unified?: SharedPollingHost;
  /** Учёт владельцев токенов в старом Python для безопасной передачи. */
  private readonly legacyRoutes = new RunnerLegacyRoutes();
  /** Диспетчер временных обработчиков process. */
  private runtime?: ProcessPollingRuntime;
  /** ID ботов, направленных в Node, включая ещё не готовые регистрации. */
  private readonly nodeBots = new Set<number>();
  /** Ограничение только отдельных Python-процессов; общий обработчик не ограничивает число сценариев. */
  private maximum?: number;
  /** Состояние обратного давления на вывод. */
  private paused = false;
  /** Группа больше не принимает новые команды. */
  private closed = false;
  /** Ожидание фактического завершения всех процессов. */
  private terminating?: Promise<void>;
  /** Суммарные измерения постоянного и временных Python-процессов смешанной группы. */
  private readonly memoryTotals = new RunnerMemoryTotals();
  /** @param config - Настройки исполнителя. @param base - Идентичность группы. @param emit - События панели. @param gone - Удаление группы. */
  constructor(private readonly config: RunnerConfig, private readonly base: { w: string; i: string },
    private readonly emit: (event: RunnerEvent) => void, private readonly gone: () => void) {
    if (config.pythonHost === "unified") this.unified = new SharedPollingHost(config, event => {
      if (event.type === "process" || (event.type === "system" && event.content === "worker_ready")) return;
      this.emit({ ...this.base, k: "line", l: JSON.stringify(event) });
    }, memoryKb => this.emit({ ...this.base, k: "line", l: JSON.stringify({ type: "system", content: `memory_kb:${memoryKb}` }) }));
    if (this.unified) this.unified.onPermanentCrash = () => { void this.finish({ ...this.base, k: "exit", c: "1" }); };
    if (config.processPolling !== "node") this.ensureLegacy();
    else queueMicrotask(() => { if (!this.closed) this.system("worker_ready"); });
  }
  /** PID только действительно запущенного общего Python; виртуальная группа PID не имеет. */
  get pid(): number | undefined { return this.unified?.counters().pid ?? this.legacy?.pid; }
  /** Сохраняет обновление спящего webhook-сценария; false оставляет прежнюю прямую доставку Python. */
  enqueueWebhook(projectId: number, tokenId: number, update: unknown, secret: string): Promise<boolean> {
    return this.runtime?.webhook.enqueue(projectId, tokenId, update, secret) ?? Promise.resolve(false);
  }
  /** Сообщает реальные каналы и дочерние PID без деления общей памяти Node между ботами. */
  memoryCounters() {
    return { unifiedHost: this.unified?.counters() ?? null, execution: this.unified ? "unified" : this.config.processPolling === "node" ? "mixed" : "python",
      pythonMemoryKb: this.unified?.counters().memoryKb ?? this.memoryTotals.snapshot().total,
      legacy: this.legacy?.memoryCounters() ?? null, polling: this.runtime?.counters() ?? null };
  }
  /** Передаёт приостановку всем текущим и будущим каналам. */
  pauseOutput(paused: boolean): void {
    this.paused = paused;
    this.legacy?.pauseOutput(paused);
    this.unified?.pauseOutput(paused);
    this.runtime?.pauseOutput(paused);
  }
  /** Маршрутизирует проверенную команду, сохраняя прежний Python для direct и ondemand. */
  async sendAsync(line: string): Promise<void> {
    if (this.closed) throw new Error("Группа исполнителя уже остановлена");
    const command = JSON.parse(line) as ProcessStartCommand;
    if (command.cmd === "shutdown") return this.shutdown();
    if (command.cmd === "start_bot" && command.webhook_url && usesNodePolling(command) && this.config.processPolling !== "node")
      throw new Error("Сон webhook требует RUNNER_PROCESS_POLLING=node");
    if (command.cmd === "start_bot" && this.config.processPolling === "node" && usesNodePolling(command)) {
      const isolated = this.config.processHandler === "isolated";
      const bot = processPollingBot(command, this.base.w, this.base.i, isolated);
      const maximum = isolated ? Number(bot.env.BOT_ON_DEMAND_MAX_ACTIVE ?? "0") : undefined;
      if (isolated && this.maximum !== undefined && this.maximum !== maximum)
        throw new Error("Боты одной группы должны иметь одинаковый предел обработчиков");
      await validateProcessBuild(this.config, bot.botFile);
      if (this.closed) throw new Error("Группа остановлена во время проверки сборки");
      if (!this.runtime) {
        this.maximum = maximum;
        this.runtime = new ProcessPollingRuntime(this.config, (l) => this.emit({ ...this.base, k: "line",
          l: this.memoryTotals.observe(l, 'polling') }), maximum, this.unified);
        this.runtime.pauseOutput(this.paused);
      }
      await this.unified?.stopPermanent(bot.tokenId);
      await this.legacyRoutes.stopBeforeHandoff(this.legacy, bot.tokenId);
      this.nodeBots.add(bot.tokenId);
      await this.runtime.dispatcher.start(bot);
      return;
    }
    if (this.nodeBots.has(command.token_id)) {
      const stopped = await this.runtime?.dispatcher.stop(command.token_id);
      this.nodeBots.delete(command.token_id);
      if (command.cmd === "stop_bot") {
        // Упавшая регистрация уже удалена диспетчером, но панели всё равно нужен ответ.
        if (!stopped) this.system(`bot_stopped:${command.token_id}`);
        return;
      }
    }
    if (this.unified) {
      if (command.cmd === "start_bot") await this.unified.stopPermanent(command.token_id);
      await this.unified.sendPermanent(command as unknown as Record<string, unknown>); return;
    }
    if (command.cmd === "status" && !this.legacy) return;
    if (command.cmd === "start_bot") this.legacyRoutes.started(command.token_id);
    await this.ensureLegacy().sendAsync(line);
  }
  /** Создаёт настоящий старый Python только для первой соответствующей команды. */
  private ensureLegacy(): LocalWorkerChannel {
    if (this.legacy) return this.legacy;
    const channel = new LocalWorkerChannel({ command: this.config.pythonPath, args: ["-u", this.config.workerScript],
      env: { ...buildWorkerBaseEnv(process.env, { includeConnections: false }), PROJECT_ID: this.base.w, WORKER_REPORT_MEMORY: "true" } });
    channel.pauseOutput(this.paused);
    this.legacy = channel;
    forwardWorkerEvents(channel, this.base, (event) => {
      this.legacyRoutes.observe(event);
      if (event.k === "exit" || event.k === "error") { void this.finish(event); return; }
      if (this.config.processPolling === "node" && event.k === "line" && event.l
        && event.l.includes('"worker_ready"')) return;
      this.emit(event.k === "line" && event.l ? { ...event, l: this.memoryTotals.observe(event.l, 'legacy') } : event);
    }, () => {});
    return channel;
  }
  /** Публикует системное сообщение логической группы. */
  private system(content: string): void { this.emit({ ...this.base, k: "line", l: JSON.stringify({ type: "system", content }) }); }
  /** Завершает группу и освобождает регистрации до единственного события окончания. */
  private finish(event: RunnerEvent): Promise<void> {
    if (this.terminating) return this.terminating;
    this.closed = true;
    this.terminating = (async () => {
      try { await this.runtime?.shutdown(); await this.unified?.shutdown(); }
      catch { console.error("Не удалось штатно завершить временные обработчики группы"); }
      finally { this.gone(); this.emit(event); }
    })();
    return this.terminating;
  }

  /** Немедленно завершает общий процесс и отменяет временные обработчики. */
  kill(): void {
    this.closed = true;
    this.runtime?.kill();
    this.unified?.kill();
    if (this.legacy) this.legacy.kill();
    else void this.finish({ ...this.base, k: "exit", s: "SIGKILL" });
  }

  /** Дожидается остановки всех настоящих процессов группы. */
  async shutdown(): Promise<void> {
    if (this.terminating) return this.terminating;
    this.closed = true;
    if (this.legacy) await stopWorker(this.legacy, 5_000);
    await this.finish({ ...this.base, k: "exit", c: "0" });
  }
}
