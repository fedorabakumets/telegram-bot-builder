/** @fileoverview Запуск и отмена одной активации без завершения соседних сценариев. */
import { randomUUID } from "node:crypto";
import type { PollingBot } from "./dispatcherTypes";
import type { PythonPollingChild } from "./pythonChild";
import type { SharedPythonTransport } from "./sharedTransport";

/** Минимальный доступ к физическому владельцу без раскрытия внутреннего состояния. */
interface ActivationOwner {
  /** Барьер закрытия пустого хоста. */
  readonly closing?: Promise<void>;
  /** Реальный PID и состояние давления. */
  readonly actualPid?: number;
  /** Требуемое состояние выходных потоков. */
  readonly paused: boolean;
  /** Реестр незавершённых активаций. */
  activations: Map<string, {
    /** Идентификатор токена сценария. */
    tokenId: number;
    /** Подтверждает готовность. */
    ready(): void;
    /** Отклоняет ожидание готовности. */
    fail(error: Error): void;
    /** Подтверждает окончательную очистку. */
    finish(result: { code: number | null; signal: string | null }): void;
  }>;
  /** Лениво получает транспорт текущего поколения. */
  getTransport(): SharedPythonTransport;
  /** Проверяет возможность выгрузки пустого процесса. */
  closeIdle(): void;
  /** Передаёт давление физическому процессу. */
  pauseOutput(paused: boolean): void;
}

/** Создаёт одну активацию с ограниченным ожиданием готовности и окончательной остановки. */
export async function startSharedActivation(host: ActivationOwner, bot: PollingBot,
  signal: AbortSignal): Promise<PythonPollingChild> {
    while (host.closing) await host.closing;
    if (signal.aborted) throw new Error("Запуск обработчика отменён");
    const transport = host.getTransport();
    const id = randomUUID();
    let ready!: () => void;
    let fail!: (error: Error) => void;
    let finish!: (result: { code: number | null; signal: string | null }) => void;
    const started = new Promise<void>((resolve, reject) => { ready = resolve; fail = reject; });
    void started.catch(() => {});
    const done = new Promise<{ code: number | null; signal: string | null }>(resolve => { finish = resolve; });
    host.activations.set(id, { tokenId: bot.tokenId, ready, fail, finish });
    let issued = false;
    let stopping: Promise<void> | undefined;
    /** Выгружает только данный сценарий; зависшая очистка требует завершения общего процесса. */
    const stop = (): Promise<void> => stopping ??= (async () => {
      if (!issued) { host.activations.delete(id); finish({ code: 0, signal: null }); host.closeIdle(); return; }
      const timer = setTimeout(() => transport.kill(), 10_000);
      transport.pauseOutput(false);
      try { await transport.send({ cmd: "stop", token_id: bot.tokenId, activation_id: id }); await done; }
      catch { transport.kill(); await done; }
      finally { clearTimeout(timer); transport.pauseOutput(host.paused); }
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
      const owner = host;
      return { pid: transport.pid, get actualPid() { return owner.actualPid ?? transport.pid; }, done, stop,
        pauseOutput: paused => host.pauseOutput(paused), kill: () => transport.kill() };
    } catch (error) { await stop(); throw error; }
    finally { clearTimeout(timer); }
}
