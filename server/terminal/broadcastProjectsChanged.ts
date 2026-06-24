/**
 * @fileoverview Рассылка сигнала «список проектов изменился» на owner-канал.
 * @description Вызывается после создания/переименования/переупорядочивания/удаления
 * проекта: формирует projects-changed и рассылает всем WS-соединениям владельца
 * (ключ `user_<ownerId>` в карте activeConnections). Список проектов принадлежит
 * владельцу, а не одному проекту, поэтому событие шлётся на owner-канал, а не в
 * комнату конкретного проекта.
 * @module server/terminal/broadcastProjectsChanged
 */

import { WebSocket } from 'ws';
import { activeConnections } from './activeConnections';
import type {
  ProjectsChangedMessage,
  ProjectsChangedReason,
} from '../../shared/project-sync/projects-changed-message';

/**
 * Вещает сигнал об изменении списка проектов всем соединениям владельца.
 * @param ownerId - ID владельца, чей список проектов изменился
 * @param reason - Причина изменения (опционально)
 */
export function broadcastProjectsChanged(ownerId: number, reason?: ProjectsChangedReason): void {
  const key = `user_${ownerId}`;
  const connections = activeConnections.get(key);
  if (!connections?.size) return;

  const message: ProjectsChangedMessage = {
    type: 'projects-changed',
    ownerId,
    reason,
    timestamp: Date.now(),
  };
  const payload = JSON.stringify(message);
  for (const ws of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}
