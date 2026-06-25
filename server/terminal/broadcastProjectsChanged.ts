/**
 * @fileoverview Рассылка сигнала «список проектов изменился» на каналы пользователей.
 * @description Вызывается после создания/переименования/переупорядочивания/удаления
 * проекта: формирует projects-changed и рассылает всем WS-соединениям указанных
 * пользователей (ключ `user_<id>` в карте activeConnections). Список проектов
 * принадлежит пользователю, а не одному проекту, поэтому событие шлётся на
 * пользовательские каналы, а не в комнату конкретного проекта. Для общих проектов
 * получателями являются владелец и все коллабораторы.
 * @module server/terminal/broadcastProjectsChanged
 */

import { WebSocket } from 'ws';
import { activeConnections } from './activeConnections';
import type {
  ProjectsChangedMessage,
  ProjectsChangedReason,
} from '../../shared/project-sync/projects-changed-message';

/**
 * Отправляет projects-changed всем WS-соединениям одного пользователя.
 * @param userId - ID пользователя-получателя
 * @param reason - Причина изменения (опционально)
 */
function sendToUser(userId: number, reason?: ProjectsChangedReason): void {
  const connections = activeConnections.get(`user_${userId}`);
  if (!connections?.size) return;

  const message: ProjectsChangedMessage = {
    type: 'projects-changed',
    ownerId: userId,
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

/**
 * Вещает сигнал об изменении списка проектов нескольким пользователям.
 * Дедуплицирует id и пропускает невалидные (не положительные числа) значения.
 * @param userIds - Массив ID пользователей-получателей
 * @param reason - Причина изменения (опционально)
 */
export function broadcastProjectsChangedToUsers(
  userIds: number[],
  reason?: ProjectsChangedReason,
): void {
  const seen = new Set<number>();
  for (const userId of userIds) {
    if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) continue;
    if (seen.has(userId)) continue;
    seen.add(userId);
    sendToUser(userId, reason);
  }
}

/**
 * Вещает сигнал об изменении списка проектов всем соединениям владельца.
 * Тонкая обёртка над broadcastProjectsChangedToUsers для обратной совместимости.
 * @param ownerId - ID владельца, чей список проектов изменился
 * @param reason - Причина изменения (опционально)
 */
export function broadcastProjectsChanged(ownerId: number, reason?: ProjectsChangedReason): void {
  broadcastProjectsChangedToUsers([ownerId], reason);
}
