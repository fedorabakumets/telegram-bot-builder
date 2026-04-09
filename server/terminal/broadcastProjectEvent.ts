/**
 * @fileoverview Рассылка событий проекта всем подключённым WebSocket-клиентам
 * @module server/terminal/broadcastProjectEvent
 */

import { WebSocket } from 'ws';
import { activeConnections } from './activeConnections';
import type { ProjectEvent } from './ProjectEvent';

/**
 * Рассылает событие проекта всем WebSocket-соединениям данного проекта.
 * Итерирует activeConnections и отправляет сообщение всем клиентам,
 * чей ключ начинается с `${projectId}_`.
 *
 * @param projectId - Идентификатор проекта
 * @param event - Событие для рассылки
 */
export function broadcastProjectEvent(projectId: number, event: ProjectEvent): void {
  const prefix = `${projectId}_`;
  const payload = JSON.stringify(event);

  for (const [key, connections] of activeConnections.entries()) {
    if (!key.startsWith(prefix)) continue;

    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}
