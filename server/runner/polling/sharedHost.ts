/** @fileoverview Активации ботов в одном долговечном Python-процессе с раздельным завершением сценариев. */
import { PermanentActivations } from "./permanentActivations";
import { startSharedActivation } from "./sharedActivationStart";
import { dirname, join } from "node:path";
import type { RunnerConfig } from "../runnerConfig";
import type { PollingBot } from "./dispatcherTypes";
import type { PythonPollingChild } from "./pythonChild";
import { SharedPythonTransport, type SharedTransportOptions } from "./sharedTransport";

/** Отдельная активация, которую нельзя перепутать с повторным запуском того же бота. */
interface Activation {
  /** Идентификатор бота. */
  tokenId: number;
  /** Подтверждение готовности сценария. */
  ready(): void;
  /** Отказ запуска сценария. */
  fail(error: Error): void;
  /** Завершение сценария и очистки состояния. */
  finish(result: { code: number | null; signal: string | null }): void;
}

/** Общий интерпретатор существует только пока есть запускающиеся или активные сценарии. */
export class SharedPollingHost {
  /** Лениво созданный транспорт общего интерпретатора. */
  private transport?: SharedPythonTransport;
  /** Завершение пустого процесса, которое новый запуск обязан дождаться. */
  private closing?: Promise<void>;
  /** Активные и ещё запускающиеся сценарии. */
  private readonly activations = new Map<string, Activation>();
  /** Последняя общая резидентная память, учитываемая ровно один раз. */
  private memoryKb = 0;
  /** Подтверждённый PID интерпретатора. */
  private actualPid?: number;
  /** Запрещает повторный запуск после окончательной остановки. */
  private closed = false;
  /** Запомненное обратное давление. */
  private paused = false;
  /** Постоянные сценарии удерживают общий процесс после сна временных. */
  private readonly permanent = new PermanentActivations();
  /** Наблюдатель замеров временных активаций при внешнем владельце хоста. */
  processObserver?: (event: Record<string, unknown>) => void;
  /** Сбой процесса с постоянными ботами требует восстановления всей группы. */
  onPermanentCrash?: () => void;
  /** Принимает безопасные события и отдельно общую память; launch используется в адресных тестах. */
  constructor(private readonly config: RunnerConfig,
    private readonly onEvent: (event: Record<string, unknown>) => void,
    private readonly onMemory: (memoryKb: number, actualPid?: number) => void = () => {},
    private readonly launch?: Omit<SharedTransportOptions, "onEvent" | "onLog">) {}
  /** Создаёт общий процесс только при первом настоящем обновлении. */
  private getTransport(): SharedPythonTransport {
    if (this.closed) throw new Error("Общий обработчик остановлен");
    if (this.transport) return this.transport;
    const transport = new SharedPythonTransport({ ...(this.launch ?? { command: this.config.pythonPath,
      args: ["-u", join(dirname(this.config.workerScript), "process_child_guard.py"),
        join(dirname(this.config.workerScript), this.config.pythonHost === "unified" ? "unified_worker.py" : "shared_worker.py")], env: process.env }),
      onEvent: event => { if (this.transport === transport) this.event(event); },
      onLog: content => this.onEvent({ type: "stderr", content }),
    });
    this.transport = transport;
    transport.pauseOutput(this.paused);
    void transport.done.then(result => {
      if (this.transport !== transport) return;
      for (const entry of this.activations.values()) {
        entry.fail(new Error("Общий обработчик завершился")); entry.finish({ ...result, code: result.code || 1 });
      }
      const permanentFailed = this.permanent.tokens.size > 0;
      for (const tokenId of this.permanent.tokens) this.onEvent({ type: "system", content: `bot_exited:${tokenId}:error` });
      this.activations.clear(); this.permanent.clear(); this.memoryKb = 0; this.actualPid = undefined; this.onMemory(0);
      if (this.transport === transport) this.transport = undefined;
      if (permanentFailed && !this.closed) this.onPermanentCrash?.();
    });
    return transport;
  }
  /** Освобождает интерпретатор после последней активации, сохраняя барьер нового запуска. */
  private closeIdle(): void {
    if (this.activations.size || this.permanent.tokens.size || !this.transport || this.closing) return;
    const transport = this.transport;
    this.closing = transport.shutdown().finally(() => { this.closing = undefined; });
    void this.closing.catch(() => {});
  }
  /** Передаёт постоянный сценарий тому же физическому интерпретатору. */
  async sendPermanent(command: Record<string, unknown>): Promise<void> {
    while (this.closing) await this.closing;
    const tokenId = Number(command.token_id);
    if (command.cmd === "status" && !this.transport) return;
    if (command.cmd === "stop_bot" && !this.permanent.tokens.has(tokenId)) {
      this.onEvent({ type: "system", content: `bot_stopped:${tokenId}` }); return;
    }
    if (command.cmd === "start_bot") this.permanent.tokens.add(tokenId);
    try { await this.getTransport().ready; await this.transport!.send(command); }
    catch (error) { if (command.cmd === "start_bot") this.permanent.tokens.delete(tokenId); this.closeIdle(); throw error; }
  }
  /** Ожидает освобождение постоянного сценария перед передачей токена Node. */
  stopPermanent(tokenId: number): Promise<void> {
    return this.permanent.stop(tokenId, command => this.sendPermanent(command));
  }
  /** Обрабатывает только события текущей активации; RSS принадлежит общему процессу. */
  private event(event: Record<string, unknown>): void {
    if (event.type === "process") this.processObserver?.(event);
    if (event.type === "system") {
      if (this.permanent.observe(event)) { this.closeIdle(); return; }
      const memory = typeof event.content === "string" ? /^memory_kb:(\d+)$/.exec(event.content) : null;
      if (memory) { this.memoryKb = Number(memory[1]); this.onMemory(this.memoryKb, this.actualPid); }
      else this.onEvent(event);
      this.closeIdle(); return;
    }
    if (event.type === "process" && !event.activation_id) {
      if (event.event === "ready" && Number.isSafeInteger(event.pid) && Number(event.pid) > 0) this.actualPid = Number(event.pid);
      if (event.event === "memory" && event.pid !== this.actualPid && Number.isFinite(event.memory_kb) && Number(event.memory_kb) >= 0) {
        this.memoryKb = Number(event.memory_kb); this.onMemory(this.memoryKb, this.actualPid);
      }
      this.onEvent(event); return;
    }
    if (this.config.pythonHost === "unified" && !event.activation_id
      && (["worker_runtime_counters", "worker_memory_profile"].includes(String(event.type))
        || (["stdout", "stderr", "bot_runtime_error"].includes(String(event.type)) && this.permanent.tokens.has(Number(event.token_id))))) {
      this.onEvent(event); return;
    }
    const id = String(event.activation_id ?? "");
    const entry = this.activations.get(id);
    if (!entry || Number(event.token_id) !== entry.tokenId) return;
    if (event.type === "process" && event.event === "ready") entry.ready();
    if (event.type === "process" && event.event === "exited") {
      this.activations.delete(id);
      entry.fail(new Error("Сценарий завершился до готовности"));
      entry.finish({ code: Number(event.code) === 0 ? 0 : 1, signal: null });
      this.closeIdle();
    }
    this.onEvent(event);
  }
  /** Пробуждает сценарий, не создавая отдельный интерпретатор на каждого бота. */
  async start(bot: PollingBot, signal: AbortSignal): Promise<PythonPollingChild> {
    const owner = this;
    return startSharedActivation({ get closing() { return owner.closing; },
      get actualPid() { return owner.actualPid; }, get paused() { return owner.paused; },
      activations: this.activations, getTransport: () => this.getTransport(),
      closeIdle: () => this.closeIdle(), pauseOutput: paused => this.pauseOutput(paused) }, bot, signal);
  }

  /** Возвращает общий RSS отдельно от количества активных сценариев. */
  counters() { return { shared: true, pid: this.transport?.pid, actualPid: this.actualPid,
    memoryKb: this.memoryKb, activeHandlers: this.activations.size, handlerTokenIds: [...this.activations.values()].map(item => item.tokenId), permanentTokenIds: [...this.permanent.tokens] }; }
  /** Передаёт давление общему каналу. */
  pauseOutput(paused: boolean): void { this.paused = paused; this.transport?.pauseOutput(paused); }
  /** Принудительно завершает общий процесс вместе со всеми активациями. */
  kill(): void { this.closed = true; this.transport?.kill(); }
  /** Штатно выгружает сценарии и завершает общий процесс. */
  async shutdown(): Promise<void> { this.closed = true; await (this.closing ?? this.transport?.shutdown()); }
}
