/**
 * @fileoverview Связь панели с одним удалённым исполнителем через Redis Streams:
 * одно соединение пишет команды, второе читает события и раздаёт их каналам воркеров.
 * @module server/bots/remoteRunnerHub
 */

import type { Redis as RedisConnection } from "ioredis";
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
   * Возвращает узел исполнителя, при первом вызове подключается и сбрасывает
   * воркеры, оставшиеся от прошлого запуска панели
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
   * @returns узел после сброса воркеров исполнителя
   */
  private static async connect(runnerId: string, redisUrl: string): Promise<RemoteRunnerHub> {
    const [writer, reader] = await Promise.all([connectStreamRedis(redisUrl), connectStreamRedis(redisUrl)]);
    const hub = new RemoteRunnerHub(runnerId, writer);
    hub.follower = followStream(reader, runnerEventStream(runnerId), (fields) => hub.dispatch(fields));
    await hub.follower.ready;
    // Воркеры прошлого запуска панели держат ботов, о которых панель уже не знает
    await appendToStream(writer, runnerCommandStream(runnerId), { k: "reset" } satisfies RunnerCommand);
    console.log(`🛰️ [Runner:${runnerId}] связь установлена`);
    return hub;
  }

  /**
   * Отправляет команду исполнителю (порядок команд сохраняется)
   * @param command - Команда
   */
  send(command: RunnerCommand): void {
    appendToStream(this.writer, runnerCommandStream(this.runnerId), command).catch((error) => {
      console.error(`🛰️ [Runner:${this.runnerId}] команда ${command.k} не отправлена:`, error?.message ?? error);
    });
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

  /**
   * Передаёт событие каналу его экземпляра; события старых экземпляров отбрасываются
   * @param fields - Поля записи потока событий
   */
  private dispatch(fields: Record<string, string>): void {
    if (!fields.i || !fields.k) return;
    this.sinks.get(fields.i)?.handle(fields as unknown as RunnerEvent);
  }
}
