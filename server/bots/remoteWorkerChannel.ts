/**
 * @fileoverview Канал до воркера, запущенного удалённым исполнителем (WORKER_RUNTIME=remote).
 * @module server/bots/remoteWorkerChannel
 */

import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import type { RunnerEvent } from "../redis/workerStreams";
import type { RemoteRunnerHub, RunnerEventSink } from "./remoteRunnerHub";
import type { WorkerChannel } from "./workerChannel";
import { decodeWorkerExitCode } from "../redis/workerExitCode";

/** Сколько ждать подтверждения kill от исполнителя, прежде чем считать воркер завершённым (мс) */
const KILL_CONFIRM_MS = 5_000;

/**
 * Воркер на исполнителе: строки stdin/stdout идут через Redis Streams
 */
export class RemoteWorkerChannel extends EventEmitter implements WorkerChannel, RunnerEventSink {
  /** ID экземпляра: отличает новый воркер от старого с тем же ключом */
  readonly instance: string;

  /** true после события exit (настоящего или по таймауту kill) */
  private exited = false;

  /** Таймер ожидания подтверждения kill */
  private killTimer: ReturnType<typeof setTimeout> | null = null;
  /** Текущий запрос подтверждённой остановки и функция его завершения. */
  private retirement?: { /** Номер запроса. */ id: string; /** Завершение ожидания. */ finish: (confirmed: boolean) => void };

  /** PID на этой машине нет */
  readonly pid = undefined;

  /**
   * Просит исполнителя поднять воркер
   * @param hub - Связь с исполнителем
   * @param workerKey - Ключ воркера
   */
  constructor(private readonly hub: RemoteRunnerHub, private readonly workerKey: number, instance?: string) {
    super();
    this.instance = instance ?? randomUUID();
    hub.register(this.instance, this);
    if (!instance) void Promise.resolve(hub.send({ k: "spawn", w: String(workerKey), i: this.instance })).catch((error) => this.fail(error));
  }

  /**
   * Привязывается к уже работающему процессу после перезапуска API
   * @param hub - Связь с исполнителем
   * @param workerKey - Ключ воркера
   * @param instance - ID работающего процесса из inspect
   * @returns Канал без команды spawn
   */
  static attach(hub: RemoteRunnerHub, workerKey: number, instance: string): RemoteWorkerChannel {
    return new RemoteWorkerChannel(hub, workerKey, instance);
  }

  /**
   * Отправляет строку в stdin удалённого воркера
   * @param line - Строка JSON без перевода строки
   * @returns false, если воркер уже завершён
   */
  send(line: string): boolean {
    if (this.exited) return false;
    void Promise.resolve(this.hub.send({ k: "line", w: String(this.workerKey), i: this.instance, l: line })).catch((error) => this.fail(error));
    return true;
  }

  /** Просит исполнителя убить воркер; без ответа считает его завершённым через KILL_CONFIRM_MS */
  kill(): void {
    if (this.exited || this.killTimer) return;
    void Promise.resolve(this.hub.send({ k: "kill", w: String(this.workerKey), i: this.instance })).catch((error) => this.fail(error));
    this.killTimer = setTimeout(() => this.finish(null, "SIGKILL"), KILL_CONFIRM_MS);
  }

  /**
   * Проверяет поддержку протокола и существование нужной группы до остановки ботов.
   * @param timeoutMs - Сколько ждать свежий снимок исполнителя.
   * @param botIds - Боты, которым разрешено оставаться в группе до её остановки.
   * @returns Исполнитель поддерживает доказательство для текущего экземпляра.
   */
  async canConfirmCutoverExit(timeoutMs: number, botIds: readonly number[]): Promise<boolean> {
    if (this.exited) return false;
    try {
      const snapshot = await this.hub.inspect(timeoutMs);
      return !this.exited && snapshot.runtime?.cutoverExitProof === true
        && snapshot.workers.some(worker => worker.workerKey === this.workerKey && worker.instance === this.instance
          && worker.cutoverEligible === true
          && [...worker.tokenIds, ...worker.pendingTokenIds].every(id => botIds.includes(id)));
    } catch {
      return false;
    }
  }

  /**
   * Ждёт авторитетный ответ для этого процесса и запроса.
   * @param timeoutMs - Максимальное время ожидания ответа исполнителя.
   * @returns Подтверждение фактического выхода или false при неопределённости.
   */
  confirmCutoverExit(timeoutMs: number): Promise<boolean> {
    if (this.exited || this.retirement) return Promise.resolve(false);
    const id = randomUUID();
    return new Promise(resolve => {
      const timer = setTimeout(() => finish(false), timeoutMs);
      /** Снимает ожидание только для текущего запроса. */
      const finish = (confirmed: boolean) => {
        if (this.retirement?.id !== id) return;
        clearTimeout(timer);
        this.retirement = undefined;
        resolve(confirmed);
      };
      this.retirement = { id, finish };
      void Promise.resolve(this.hub.send({ k: "retire", w: String(this.workerKey), i: this.instance, q: id }))
        .catch(() => finish(false));
    });
  }

  /**
   * Обрабатывает событие воркера от исполнителя
   * @param event - Событие
   */
  handle(event: RunnerEvent): void {
    if (this.exited) return;
    if (event.k === "retired") {
      if (event.i !== this.instance || event.w !== String(this.workerKey) || event.q !== this.retirement?.id) return;
      this.retirement?.finish(event.confirmed === "1");
      if (event.confirmed === "1") this.finish(0, null);
      return;
    }
    if (event.k === "line" && event.l !== undefined) this.emit("line", event.l);
    else if (event.k === "stderr" && event.l) this.emit("stderr", event.l);
    // Старое «null» и повреждённые поля не превращаются в NaN или штатный код 0.
    else if (event.k === "exit") this.finish(decodeWorkerExitCode(event.c), event.s ?? null);
    else if (event.k === "error") {
      this.retirement?.finish(false);
      this.exited = true;
      this.hub.unregister(this.instance);
      this.emit("error", new Error(event.l || "Исполнитель не смог запустить воркер"));
    }
  }

  /**
   * Завершает канал один раз
   * @param code - Код выхода
   * @param signal - Сигнал
   */
  private finish(code: number | null, signal: string | null): void {
    if (this.exited) return;
    this.exited = true;
    this.retirement?.finish(false);
    if (this.killTimer) clearTimeout(this.killTimer);
    this.hub.unregister(this.instance);
    this.emit("exit", code, signal);
  }

  /**
   * Передаёт ошибку доставки управляющему коду и завершает канал
   * @param error - Ошибка Redis
   */
  private fail(error: unknown): void {
    if (this.exited) return;
    this.exited = true;
    this.retirement?.finish(false);
    if (this.killTimer) clearTimeout(this.killTimer);
    this.hub.unregister(this.instance);
    this.emit("error", error instanceof Error ? error : new Error(String(error)));
  }
}
