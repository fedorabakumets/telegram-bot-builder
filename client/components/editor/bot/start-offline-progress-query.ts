/**
 * @fileoverview Ключ React Query для прогресса start-offline-all
 * @module client/components/editor/bot/start-offline-progress-query
 */

import type { StartOfflineProgressPayload } from '@shared/project-sync/project-event';

/**
 * Ключ кэша прогресса массового запуска офлайн-ботов
 * @param projectId - ID проекта
 * @returns Query key
 */
export function startOfflineProgressQueryKey(projectId: number): unknown[] {
  return ['start-offline-progress', projectId];
}

/** Тип данных прогресса в кэше */
export type StartOfflineProgressCache = StartOfflineProgressPayload;
