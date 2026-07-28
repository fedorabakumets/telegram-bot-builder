/**
 * @fileoverview Публикация ProjectEvent в Redis (без импорта local broadcast)
 * @module server/redis/publishProjectEvent
 */

import { getRedisPublisher, isRedisAvailable } from './redisClient';
import type { ProjectEvent } from '../terminal/ProjectEvent';

/**
 * Строит имя Redis-канала для события проекта
 * @param projectId - ID проекта
 * @returns Имя канала
 */
export function projectEventChannel(projectId: number): string {
  return `platform:project_event:${projectId}`;
}

/**
 * Публикует событие проекта в Redis для других реплик.
 * No-op если Redis недоступен.
 * @param projectId - ID проекта
 * @param event - Событие (должно содержать originInstanceId)
 */
export async function publishProjectEvent(
  projectId: number,
  event: ProjectEvent,
): Promise<void> {
  if (!isRedisAvailable()) return;
  const pub = getRedisPublisher();
  if (!pub) return;
  try {
    await pub.publish(projectEventChannel(projectId), JSON.stringify(event));
  } catch (err) {
    console.error('[RedisProjectEvent] Ошибка publish:', err);
  }
}
