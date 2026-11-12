/** @fileoverview Активации ботов в одном долговечном Python-процессе с раздельным завершением сценариев. */
import { randomUUID } from "node:crypto";
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
        join(dirname(this.config.workerScript), "shared_worker.py")], env: process.env }),
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
      this.activations.clear(); this.memoryKb = 0; this.actualPid = undefined; this.onMemory(0);
      if (this.transport === transport) this.transport = undefined;
    });
    return transport;
  }

  /** Освобождает интерпретатор после последней активации, сохраняя барьер нового запуска. */
  private closeIdle(): void {
    if (this.activations.size || !this.transport || this.closing) return;
    const transport = this.transport;
    this.closing = transport.shutdown().finally(() => { this.closing = undefined; });
    void this.closing.catch(() => {});
  }

  /** Обрабатывает только события текущей активации; RSS принадлежит общему процессу. */
  private event(event: Record<string, unknown>): void {
    if (event.type === "process" && !event.activation_id) {
      if (event.event === "ready" && Number.isSafeInteger(event.pid) && Number(event.pid) > 0) this.actualPid = Number(event.pid);
      if (event.event === "memory" && event.pid !== this.actualPid && Number.isFinite(event.memory_kb) && Number(event.memory_kb) >= 0) {
        this.memoryKb = Number(event.memory_kb); this.onMemory(this.memoryKb, this.actualPid);
      }
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
    while (this.closing) await this.closing;
    if (signal.aborted) throw new Error("Запуск обработчика отменён");
    const transport = this.getTransport();
    const id = randomUUID();
    let ready!: () => void;
    let fail!: (error: Error) => void;
    let finish!: Activation["finish"];
    const started = new Promise<void>((resolve, reject) => { ready = resolve; fail = reject; });
    void started.catch(() => {});
    const done = new Promise<{ code: number | null; signal: string | null }>(resolve => { finish = resolve; });
    this.activations.set(id, { tokenId: bot.tokenId, ready, fail, finish });
    let issued = false;
    let stopping: Promise<void> | undefined;
    /** Выгружает только данный сценарий; зависшая очистка требует завершения общего процесса. */
    const stop = (): Promise<void> => stopping ??= (async () => {
      if (!issued) { this.activations.delete(id); finish({ code: 0, signal: null }); this.closeIdle(); return; }
      const timer = setTimeout(() => transport.kill(), 10_000);
      transport.pauseOutput(false);
      try { await transport.send({ cmd: "stop", token_id: bot.tokenId, activation_id: id }); await done; }
      catch { transport.kill(); await done; }
      finally { clearTimeout(timer); transport.pauseOutput(this.paused); }
    })();
    const abort = () => { fail(new Error("Запуск обработчика отменён")); void stop(); };
    signal.addEventListener("abort", abort, { once: true });
    void done.then(() => signal.removeEventListener("abort", abort));
    const timer = setTimeout(() => fail(new Error("Истекло ожидание сценария")), 60_000);
    try {
      await Promise.race([transport.ready, started]);
      if (signal.aborted) throw new Error("Запуск обработчика отменён");
      issued = true;
      await transport.send({ cmd: "start", activation_id: id, token_id: bot.tokenId, token: bot.token,
        bot_file: bot.botFile, env: bot.env, project_id: bot.projectId, idle: bot.idleTimeout });
      await started;
      const host = this;
      return { pid: transport.pid, get actualPid() { return host.actualPid ?? transport.pid; }, done, stop,
        pauseOutput: paused => this.pauseOutput(paused), kill: () => transport.kill() };
    } catch (error) { await stop(); throw error; }
    finally { clearTimeout(timer); }
  }

  /** Возвращает общий RSS отдельно от количества активных сценариев. */
  counters() { return { shared: true, pid: this.transport?.pid, actualPid: this.actualPid,
    memoryKb: this.memoryKb, activeHandlers: this.activations.size, handlerTokenIds: [...this.activations.values()].map(item => item.tokenId) }; }
  /** Передаёт давление общему каналу. */
  pauseOutput(paused: boolean): void { this.paused = paused; this.transport?.pauseOutput(paused); }
  /** Принудительно завершает общий процесс вместе со всеми активациями. */
  kill(): void { this.closed = true; this.transport?.kill(); }
  /** Штатно выгружает сценарии и завершает общий процесс. */
  async shutdown(): Promise<void> { this.closed = true; await (this.closing ?? this.transport?.shutdown()); }
}
