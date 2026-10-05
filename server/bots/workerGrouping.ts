/**
 * @fileoverview Правило группировки ботов по Python-воркерам (WORKER_GROUPING)
 * @module server/bots/workerGrouping
 */

import { runtimeEnv } from "../services/runtime-overlay";

/** Ключ общего воркера в режиме shared */
export const SHARED_WORKER_KEY = 0;

/**
 * Режим группировки:
 * "project" — воркер на проект (по умолчанию),
 * "owner" — воркер на владельца (все его проекты в одном процессе),
 * "shared" — один воркер на все проекты
 */
export type WorkerGroupingMode = "project" | "owner" | "shared";

/**
 * Читает режим группировки из окружения
 * @returns режим; неизвестное значение трактуется как "project"
 */
export function getWorkerGroupingMode(): WorkerGroupingMode {
  const value = runtimeEnv("WORKER_GROUPING")?.toLowerCase();
  return value === "shared" || value === "owner" ? value : "project";
}

/**
 * Включён ли режим одного общего воркера для всех проектов
 * @returns true, если WORKER_GROUPING=shared
 */
export function isSharedWorkerMode(): boolean {
  return getWorkerGroupingMode() === "shared";
}

/**
 * Возвращает ключ воркера, в котором должен работать бот проекта.
 * Ключи режима owner — ID владельца (> 0); проект без владельца получает
 * отрицательный ключ -projectId, чтобы не пересечься с ID пользователей.
 * @param projectId - ID проекта
 * @param ownerId - ID владельца проекта (нужен только в режиме owner)
 * @returns ключ воркера
 */
export function resolveWorkerKey(projectId: number, ownerId?: number | null): number {
  const mode = getWorkerGroupingMode();
  if (mode === "shared") return SHARED_WORKER_KEY;
  if (mode === "owner") return ownerId && ownerId > 0 ? ownerId : -projectId;
  return projectId;
}
