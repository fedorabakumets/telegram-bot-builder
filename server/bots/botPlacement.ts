/**
 * @fileoverview Где работают боты проекта: на этой машине, у общего исполнителя
 * (WORKER_RUNTIME=remote) или в отдельном сервисе Railway (WORKER_RAILWAY_PROJECTS).
 * @module server/bots/botPlacement
 */

import { isRailwayProject, railwayRunnerId } from "./railway/railwayConfig";
import { getWorkerRunnerId, getWorkerRuntime } from "./workerRuntime";

/** Место запуска воркера проекта */
export interface BotPlacement {
  /** ID исполнителя; null — воркер запускается на этой машине */
  runnerId: string | null;
  /** ID проекта, если исполнитель — его сервис на Railway, иначе null */
  railwayProjectId: number | null;
}

/**
 * Определяет место запуска ботов проекта
 * @param projectId - ID проекта
 * @returns исполнитель и признак Railway
 */
export function getProjectPlacement(projectId: number): BotPlacement {
  if (isRailwayProject(projectId)) return { runnerId: railwayRunnerId(projectId), railwayProjectId: projectId };
  if (getWorkerRuntime() === "remote") return { runnerId: getWorkerRunnerId(), railwayProjectId: null };
  return { runnerId: null, railwayProjectId: null };
}

/**
 * Проверяет, работают ли боты проекта на другой машине
 * @param projectId - ID проекта
 * @returns true для исполнителя или Railway
 */
export function isRemoteProject(projectId: number): boolean {
  return getProjectPlacement(projectId).runnerId !== null;
}
