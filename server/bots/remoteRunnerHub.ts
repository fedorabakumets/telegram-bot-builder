/**
 * @fileoverview Связь панели с одним удалённым исполнителем через Redis Streams:
 * одно соединение пишет команды, второе читает события и раздаёт их каналам воркеров.
 * @module server/bots/remoteRunnerHub
 */

import type { Redis as RedisConnection } from "ioredis";
import { randomUUID } from "node:crypto";
import type { RunnerSnapshot } from "../runner/runnerWorkers";
import {
  appendToStream,
  connectStreamRedis,
  followStream,
  runnerCommandStream,
  runnerEventStream,
  type RunnerCommand,
  type RunnerEvent,
  type StreamFollower,
} from "../redis/workerStreams";
import { RunnerPresence } from "./runnerPresence";

/** Получатель событий одного экземпляра воркера */
export interface RunnerEventSink {
  /**
   * Обрабатывает событие воркера
   * @param event - Событие от исполнителя
   */
  handle(event: RunnerEvent): void;
}

/** Узлы по ID исполнителя (создаются один раз) */
const hubs = new Map<string, Promise<RemoteRunnerHub>>();

/**
 * Связь с исполнителем: команды в поток `cmd`, события из потока `ev` по ID экземпляра
 */
export class RemoteRunnerHub {
  /** Получатели событий: ID экземпляра воркера → канал */
  private readonly sinks = new Map<string, RunnerEventSink>();
  /** Признаки жизни исполнителя */
  private readonly presence = new RunnerPresence();
  /** Запросы снимка, ожидающие ответа исполнителя */
  private readonly inspections = new Map<string, (snapshot: RunnerSnapshot) => void>();

  /**
   * @param runnerId - ID исполнителя
   * @param writer - Соединение для команд
   * @param follower - Чтение потока событий (запускается в connect)
   */
  private constructor(
    readonly runnerId: string,
    private readonly writer: RedisConnection,
    private follower: StreamFollower | null = null,
  ) {}

  /**
   * Возвращает узел исполнителя и сохраняет его работающие воркеры
   * @param runnerId - ID исполнителя
   * @param redisUrl - REDIS_URL панели
   * @returns готовый узел
   */
  static get(runnerId: string, redisUrl: string): Promise<RemoteRunnerHub> {
    let hub = hubs.get(runnerId);
    if (!hub) {
      hub = RemoteRunnerHub.connect(runnerId, redisUrl);
      hubs.set(runnerId, hub);
      hub.catch(() => hubs.delete(runnerId));
    }
    return hub;
  }

  /**
   * Подключается к Redis и начинает читать события
   * @param runnerId - ID исполнителя
   * @param redisUrl - REDIS_URL панели
   * @returns подключённый узел исполнителя
   */
  private static async connect(runnerId: string, redisUrl: string): Promise<RemoteRunnerHub> {
    const [writer, reader] = await Promise.all([connectStreamRedis(redisUrl), connectStreamRedis(redisUrl)]);
    const hub = new RemoteRunnerHub(runnerId, writer);
    hub.follower = followStream(reader, runnerEventStream(runnerId), (fields) => hub.dispatch(fields));
    await hub.follower.ready;
    console.log(`🛰️ [Runner:${runnerId}] связь установлена`);
    return hub;
  }

  /**
   * Отправляет команду исполнителю (порядок команд сохраняется)
   * @param command - Команда
   */
  send(command: RunnerCommand): Promise<void> {
    return appendToStream(this.writer, runnerCommandStream(this.runnerId), command).catch((error) => {
      console.error(`🛰️ [Runner:${this.runnerId}] команда ${command.k} не отправлена:`, error?.message ?? error);
      throw error;
    });
  }

  /**
   * Запрашивает фактический список процессов и ботов у исполнителя
   * @param timeoutMs - Максимальное время ответа
   * @returns Снимок работающих процессов
   */
  inspect(timeoutMs: number): Promise<RunnerSnapshot> {
    const q = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.inspections.delete(q);
        reject(new Error(`исполнитель ${this.runnerId} не ответил на inspect`));
      }, timeoutMs);
      this.inspections.set(q, (snapshot) => {
        clearTimeout(timer);
        this.inspections.delete(q);
        resolve(snapshot);
      });
      void this.send({ k: "inspect", q }).catch((error) => {
        clearTimeout(timer);
        this.inspections.delete(q);
        reject(error);
      });
    });
  }

  /**
   * Ждёт, пока исполнитель начнёт слушать команды (ping → pong или hello)
   * @param timeoutMs - Сколько ждать
   * @returns промис, который завершается при ответе исполнителя
   */
  waitOnline(timeoutMs: number): Promise<void> {
    return this.presence.wait(() => { void this.send({ k: "ping" }).catch(() => undefined); }, timeoutMs);
  }

  /**
   * Подписывает канал на события экземпляра воркера
   * @param instance - ID экземпляра
   * @param sink - Получатель
   */
  register(instance: string, sink: RunnerEventSink): void {
    this.sinks.set(instance, sink);
  }

  /**
   * Отписывает канал
   * @param instance - ID экземпляра
   */
  unregister(instance: string): void {
    this.sinks.delete(instance);
  }

  /** Исполнитель перезапустился: его прежние воркеры завершены, хотя exit от них не пришёл */
  private dropAll(): void {
    if (this.sinks.size > 0) {
      console.warn(`🛰️ [Runner:${this.runnerId}] исполнитель перезапущен — воркеры (${this.sinks.size}) считаются завершёнными`);
    }
    for (const [instance, sink] of [...this.sinks]) {
      sink.handle({ k: "exit", w: "", i: instance, s: "RUNNER_RESTARTED" });
    }
  }

  /**
   * Передаёт событие каналу его экземпляра; события старых экземпляров отбрасываются
   * @param fields - Поля записи потока событий
   */
  private dispatch(fields: Record<string, string>): void {
    if (fields.k === "hello" || fields.k === "pong") this.presence.notify();
    if (fields.k === "hello") return this.dropAll();
    if (fields.k === "snapshot" && fields.q && fields.d) {
      try { this.inspections.get(fields.q)?.(JSON.parse(fields.d) as RunnerSnapshot); }
      catch (error) { console.error(`🛰️ [Runner:${this.runnerId}] повреждённый снимок:`, error); }
      return;
    }
    if (!fields.i || !fields.k) return;
    this.sinks.get(fields.i)?.handle(fields as unknown as RunnerEvent);
  }
}
