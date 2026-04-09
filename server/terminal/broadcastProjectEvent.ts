/**
 * @fileoverview Рассылка событий проекта всем подключённым WebSocket-клиентам.
 * Рассылает событие как клиентам конкретного проекта, так и клиентам
 * подписанным на все проекты пользователя (ключ user_${ownerId}).
 * @module server/terminal/broadcastProjectEvent
 */

import { WebSocket } from 'ws';
import { activeConnections } from './activeConnections';
import type { ProjectEvent } from './ProjectEvent';
import { storage } from '../storages/storage';

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
 * Рассылает событие проекта всем WebSocket-соединениям данного проекта,
 * а также соединениям пользователя, подписанным на все проекты (user_${ownerId}).
 *
 * @param projectId - Идентификатор проекта
 * @param event - Событие для рассылки
 */
export async function broadcastProjectEvent(projectId: number, event: ProjectEvent): Promise<void> {
  const prefix = `${projectId}_`;
  const payload = JSON.stringify(event);

  // Рассылаем клиентам конкретного проекта
  for (const [key, connections] of activeConnections.entries()) {
    if (key.startsWith(prefix)) {
      sendToConnections(connections, payload);
    }
  }

  // Рассылаем клиентам подписанным на все проекты пользователя
  try {
    const project = await storage.getBotProject(projectId);
    const userKey = project?.ownerId ? `user_${project.ownerId}` : `user_global`;
    const userConns = activeConnections.get(userKey);
    if (userConns) {
      sendToConnections(userConns, payload);
    }
  } catch (err) {
    console.error(`[broadcastProjectEvent] Ошибка получения проекта ${projectId}:`, err);
  }
}
