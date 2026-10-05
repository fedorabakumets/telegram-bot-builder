/**
 * @fileoverview Выбор канала до воркера по подготовленному запуску: процесс здесь,
 * общий исполнитель или сервис проекта на Railway.
 * @module server/bots/openWorkerChannel
 */

import { LocalWorkerChannel } from "./localWorkerChannel";
import { ensureRailwayRunner, scheduleRailwayRunnerStop } from "./railway/railwayRunner";
import { RemoteRunnerHub } from "./remoteRunnerHub";
import { RemoteWorkerChannel } from "./remoteWorkerChannel";
import { resolveRunnerRedisUrl } from "./resolveRunnerRedisUrl";
import type { WorkerChannel } from "./workerChannel";
import type { WorkerLaunch } from "./workerLaunch";

/**
 * Открывает канал до нового воркера
 * @param workerKey - Ключ воркера
 * @param launch - Результат prepareWorkerLaunch
 * @returns канал; для исполнителя — после подключения к Redis (и подъёма сервиса Railway)
 */
export async function openWorkerChannel(workerKey: number, launch: WorkerLaunch): Promise<WorkerChannel> {
  if (!launch.runnerId) return new LocalWorkerChannel(launch);
  const hub = await RemoteRunnerHub.get(launch.runnerId, resolveRunnerRedisUrl());
  const railwayProjectId = launch.railwayProjectId ?? null;
  if (railwayProjectId === null) return new RemoteWorkerChannel(hub, workerKey);
  await ensureRailwayRunner(railwayProjectId, hub);
  const channel = new RemoteWorkerChannel(hub, workerKey);
  channel.once("exit", () => scheduleRailwayRunnerStop(railwayProjectId));
  return channel;
}
