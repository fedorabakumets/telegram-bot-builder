/**
 * @fileoverview Асинхронное определение ключа воркера с учётом владельца проекта
 * @module server/bots/resolveProjectWorkerKey
 */

import { storage } from "../storages/storage";
import { getWorkerGroupingMode, resolveWorkerKey } from "./workerGrouping";

/**
 * Определяет ключ воркера для запуска бота проекта.
 * В режиме owner читает владельца проекта из БД; при ошибке чтения проект
 * получает собственный воркер (ключ -projectId), запуск не прерывается.
 * @param projectId - ID проекта
 * @returns ключ воркера
 */
export async function resolveProjectWorkerKey(projectId: number): Promise<number> {
  if (getWorkerGroupingMode() !== "owner") return resolveWorkerKey(projectId);
  try {
    const project = await storage.getBotProject(projectId);
    return resolveWorkerKey(projectId, project?.ownerId ?? null);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[WorkerPool] владелец проекта ${projectId} не прочитан, отдельный воркер: ${message}`);
    return resolveWorkerKey(projectId, null);
  }
}
