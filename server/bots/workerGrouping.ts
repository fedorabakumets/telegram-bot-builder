/**
 * @fileoverview Правило группировки ботов по Python-воркерам
 * @module server/bots/workerGrouping
 */

/** Ключ общего воркера в режиме shared */
export const SHARED_WORKER_KEY = 0;

/**
 * Включён ли режим одного общего воркера для всех проектов
 * @returns true, если WORKER_GROUPING=shared
 */
export function isSharedWorkerMode(): boolean {
  return process.env.WORKER_GROUPING === "shared";
}

/**
 * Возвращает ключ воркера, в котором должен работать бот проекта
 * @param projectId - ID проекта
 * @returns ID проекта (режим по умолчанию) или ключ общего воркера
 */
export function resolveWorkerKey(projectId: number): number {
  return isSharedWorkerMode() ? SHARED_WORKER_KEY : projectId;
}
