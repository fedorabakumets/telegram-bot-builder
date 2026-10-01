/**
 * @fileoverview Сервис Railway с исполнителем проекта: поднять перед запуском воркера
 * и остановить, когда воркер завершился, чтобы не платить за простой.
 * @module server/bots/railway/railwayRunner
 */

import type { RemoteRunnerHub } from "../remoteRunnerHub";
import {
  createRailwayService,
  deployRailwayService,
  findRailwayService,
  latestRailwayDeployment,
  stopRailwayDeployment,
  updateRailwayService,
} from "./railwayApi";
import { getRailwayConfig, railwayRunnerId, railwayServiceName } from "./railwayConfig";

/** Сколько ждать исполнителя после деплоя: загрузка образа и старт контейнера */
const DEPLOY_START_TIMEOUT_MS = 240_000;

/** Сколько ждать ответа уже работающего исполнителя */
const RUNNING_PING_TIMEOUT_MS = 15_000;

/** Статусы деплоя, который ещё поднимается */
const STARTING_STATUSES = new Set(["QUEUED", "WAITING", "INITIALIZING", "BUILDING", "DEPLOYING"]);

/**
 * Переменные сервиса исполнителя
 * @param projectId - ID проекта
 * @param redisUrl - REDIS_URL для исполнителя
 * @returns переменные
 */
function runnerVariables(projectId: number, redisUrl: string): Record<string, string> {
  return { REDIS_URL: redisUrl, RUNNER_ID: railwayRunnerId(projectId) };
}

/**
 * Поднимает сервис исполнителя проекта и ждёт, пока он начнёт слушать команды
 * @param projectId - ID проекта
 * @param hub - Связь с исполнителем проекта
 * @throws Error, если сервис не поднялся или API Railway недоступен
 */
export async function ensureRailwayRunner(projectId: number, hub: RemoteRunnerHub): Promise<void> {
  const config = getRailwayConfig();
  const name = railwayServiceName(projectId);
  const variables = runnerVariables(projectId, config.runnerRedisUrl);
  const serviceId = await findRailwayService(config, name);
  if (!serviceId) {
    console.log(`🚂 [Railway] создаём сервис ${name} (${config.image})`);
    await createRailwayService(config, name, variables);
    return hub.waitOnline(DEPLOY_START_TIMEOUT_MS);
  }
  const latest = await latestRailwayDeployment(config, serviceId);
  if (latest && STARTING_STATUSES.has(latest.status)) return hub.waitOnline(DEPLOY_START_TIMEOUT_MS);
  if (latest?.status === "SUCCESS") {
    try {
      return await hub.waitOnline(RUNNING_PING_TIMEOUT_MS);
    } catch {
      console.warn(`🚂 [Railway] ${name} не отвечает — разворачиваем заново`);
    }
  }
  console.log(`🚂 [Railway] разворачиваем сервис ${name}`);
  await updateRailwayService(config, serviceId, variables);
  await deployRailwayService(config, serviceId);
  await hub.waitOnline(DEPLOY_START_TIMEOUT_MS);
}

/**
 * Останавливает сервис исполнителя проекта; ошибки только логируются
 * @param projectId - ID проекта
 */
export async function stopRailwayRunner(projectId: number): Promise<void> {
  const name = railwayServiceName(projectId);
  try {
    const config = getRailwayConfig();
    const serviceId = await findRailwayService(config, name);
    const latest = serviceId ? await latestRailwayDeployment(config, serviceId) : null;
    if (!latest || latest.status === "REMOVED" || latest.status === "REMOVING") return;
    await stopRailwayDeployment(config, latest.id);
    console.log(`🚂 [Railway] сервис ${name} остановлен`);
  } catch (error) {
    console.error(`🚂 [Railway] не удалось остановить ${name}:`, error instanceof Error ? error.message : error);
  }
}
