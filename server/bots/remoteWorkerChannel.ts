/**
 * @fileoverview Канал до воркера, запущенного удалённым исполнителем (WORKER_RUNTIME=remote).
 * @module server/bots/remoteWorkerChannel
 */

import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import type { RunnerEvent } from "../redis/workerStreams";
import type { RemoteRunnerHub, RunnerEventSink } from "./remoteRunnerHub";
import type { WorkerChannel } from "./workerChannel";

/** Сколько ждать подтверждения kill от исполнителя, прежде чем считать воркер завершённым (мс) */
const KILL_CONFIRM_MS = 5_000;

/**
 * Воркер на исполнителе: строки stdin/stdout идут через Redis Streams
 */
export class RemoteWorkerChannel extends EventEmitter implements WorkerChannel, RunnerEventSink {
  /** ID экземпляра: отличает новый воркер от старого с тем же ключом */
  readonly instance = randomUUID();

  /** true после события exit (настоящего или по таймауту kill) */
  private exited = false;

  /** Таймер ожидания подтверждения kill */
  private killTimer: ReturnType<typeof setTimeout> | null = null;

  /** PID на этой машине нет */
  readonly pid = undefined;

  /**
   * Просит исполнителя поднять воркер
   * @param hub - Связь с исполнителем
   * @param workerKey - Ключ воркера
   */
  constructor(private readonly hub: RemoteRunnerHub, private readonly workerKey: number) {
    super();
    hub.register(this.instance, this);
    hub.send({ k: "spawn", w: String(workerKey), i: this.instance });
  }

  /**
   * Отправляет строку в stdin удалённого воркера
   * @param line - Строка JSON без перевода строки
   * @returns false, если воркер уже завершён
   */
  send(line: string): boolean {
    if (this.exited) return false;
    this.hub.send({ k: "line", w: String(this.workerKey), i: this.instance, l: line });
    return true;
  }

  /** Просит исполнителя убить воркер; без ответа считает его завершённым через KILL_CONFIRM_MS */
  kill(): void {
    if (this.exited || this.killTimer) return;
    this.hub.send({ k: "kill", w: String(this.workerKey), i: this.instance });
    this.killTimer = setTimeout(() => this.finish(null, "SIGKILL"), KILL_CONFIRM_MS);
  }

  /**
   * Обрабатывает событие воркера от исполнителя
   * @param event - Событие
   */
  handle(event: RunnerEvent): void {
    if (this.exited) return;
    if (event.k === "line" && event.l !== undefined) this.emit("line", event.l);
    else if (event.k === "stderr" && event.l) this.emit("stderr", event.l);
    else if (event.k === "exit") this.finish(event.c !== undefined ? Number(event.c) : null, event.s ?? null);
    else if (event.k === "error") {
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
    if (this.killTimer) clearTimeout(this.killTimer);
    this.hub.unregister(this.instance);
    this.emit("exit", code, signal);
  }
}
