/**
 * @fileoverview Рассылка событий проекта всем подключённым WebSocket-клиентам.
 * Local fan-out + опциональный Redis publish для multi-instance.
 * @module server/terminal/broadcastProjectEvent
 */

import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';
import { activeConnections } from './activeConnections';
import type { ProjectEvent } from './ProjectEvent';
import { storage } from '../storages/storage';
import { getInstanceId } from '../redis/instanceId';
import { isRedisAvailable } from '../redis/redisClient';
import { publishProjectEvent } from '../redis/publishProjectEvent';

/**
 * Отправляет payload всем открытым соединениям из набора
 * @param connections - Набор WebSocket-соединений
 * @param payload - Сериализованное сообщение
 */
function sendToConnections(connections: Set<WebSocket>, payload: string): void {
  for (const ws of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

/**
 * Локальная рассылка события по WS этого инстанса (без Redis publish).
 * Используется Redis-подписчиками (bot:* и platform:project_event), чтобы не зациклить pub/sub.
 * @param projectId - Идентификатор проекта
 * @param event - Событие для рассылки
 */
export async function broadcastProjectEventLocal(
  projectId: number,
  event: ProjectEvent,
): Promise<void> {
  const prefix = `${projectId}_`;
  const payload = JSON.stringify(event);

  for (const [key, connections] of activeConnections.entries()) {
    if (key.startsWith(prefix)) {
      sendToConnections(connections, payload);
    }
  }

  try {
    const project = await storage.getBotProject(projectId);
    const ownerKey = project?.ownerId ? `user_${project.ownerId}` : `user_global`;
    const ownerConns = activeConnections.get(ownerKey);
    console.log(
      `[broadcast] event=${event.type} projectId=${projectId} ownerKey=${ownerKey} ownerConns=${ownerConns?.size ?? 0}`,
    );
    if (ownerConns) {
      sendToConnections(ownerConns, payload);
    }

    for (const [key, connections] of activeConnections.entries()) {
      if (!key.startsWith('user_')) continue;
      if (key === ownerKey) continue;
      const userIdStr = key.replace('user_', '');
      const userId = parseInt(userIdStr, 10);
      if (isNaN(userId)) continue;
      const hasAccess = await storage.hasProjectAccess(projectId, userId);
      if (hasAccess) {
        sendToConnections(connections, payload);
      }
    }
  } catch (err) {
    console.error(`[broadcastProjectEventLocal] Ошибка получения проекта ${projectId}:`, err);
  }
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
  const enriched: ProjectEvent = {
    ...event,
    eventId: event.eventId ?? randomUUID(),
    originInstanceId: event.originInstanceId ?? getInstanceId(),
    timestamp: event.timestamp || new Date().toISOString(),
  };

  await broadcastProjectEventLocal(projectId, enriched);

  if (isRedisAvailable()) {
    await publishProjectEvent(projectId, enriched);
  }
}
