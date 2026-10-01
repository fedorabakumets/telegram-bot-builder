/**
 * @fileoverview Выбор канала до воркера по подготовленному запуску: процесс здесь или исполнитель.
 * @module server/bots/openWorkerChannel
 */

import { LocalWorkerChannel } from "./localWorkerChannel";
import { RemoteRunnerHub } from "./remoteRunnerHub";
import { RemoteWorkerChannel } from "./remoteWorkerChannel";
import type { WorkerChannel } from "./workerChannel";
import type { WorkerLaunch } from "./workerLaunch";

/**
 * Открывает канал до нового воркера
 * @param workerKey - Ключ воркера
 * @param launch - Результат prepareWorkerLaunch
 * @returns канал; для remote — после подключения к Redis
 */
export async function openWorkerChannel(workerKey: number, launch: WorkerLaunch): Promise<WorkerChannel> {
  if (!launch.runnerId) return new LocalWorkerChannel(launch);
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) throw new Error("WORKER_RUNTIME=remote требует REDIS_URL");
  const hub = await RemoteRunnerHub.get(launch.runnerId, redisUrl);
  return new RemoteWorkerChannel(hub, workerKey);
}
