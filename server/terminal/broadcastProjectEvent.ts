/**
 * @fileoverview Рассылка событий проекта всем подключённым WebSocket-клиентам.
 * Local fan-out + опциональный Redis publish для multi-instance.
 * @module server/terminal/broadcastProjectEvent
 */

import { randomUUID } from 'crypto';
import type { ProjectEvent } from './ProjectEvent';
import { authorizedFanout } from './authorized-fanout';
import { safeAuthPayloads } from '../utils/safe-auth-payloads';
import { getInstanceId } from '../redis/instanceId';
import { isRedisAvailable } from '../redis/redisClient';
import { publishProjectEvent } from '../redis/publishProjectEvent';

/** Локально доставляет событие с повторной проверкой сессии и прав проекта. */
export async function broadcastProjectEventLocal(projectId: number, event: ProjectEvent): Promise<void> {
  await authorizedFanout(JSON.stringify(safeAuthPayloads(event)), projectId, event.tokenId ?? 0);
}

/**
 * Рассылает событие локально и (если Redis доступен) публикует для других реплик.
 * @param projectId - Идентификатор проекта
 * @param event - Событие для рассылки
 */
export async function broadcastProjectEvent(
  projectId: number,
  event: ProjectEvent,
): Promise<void> {
  const enriched: ProjectEvent = safeAuthPayloads({
    ...event,
    eventId: event.eventId ?? randomUUID(),
    originInstanceId: event.originInstanceId ?? getInstanceId(),
    timestamp: event.timestamp || new Date().toISOString(),
  });

  await broadcastProjectEventLocal(projectId, enriched);

  if (isRedisAvailable()) {
    await publishProjectEvent(projectId, enriched);
  }
}
