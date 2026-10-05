/**
 * @fileoverview Активные WebSocket-соединения чата поддержки
 * @module server/support/support-connections
 */

import { WebSocket } from "ws";

/** Сокеты пользователей платформы по Telegram id */
const userSockets = new Map<number, Set<WebSocket>>();

/** Сокеты открытой админки */
const adminSockets = new Set<WebSocket>();

/**
 * Отправляет строку открытым сокетам набора
 * @param sockets - Набор соединений
 * @param payload - JSON события
 */
function sendOpen(sockets: Set<WebSocket> | undefined, payload: string): void {
  if (!sockets) return;
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
}

/**
 * Регистрирует сокет пользователя
 * @param userId - Идентификатор Telegram
 * @param ws - Соединение
 */
export function addUserSupportSocket(userId: number, ws: WebSocket): void {
  const set = userSockets.get(userId) ?? new Set<WebSocket>();
  set.add(ws);
  userSockets.set(userId, set);
}

/**
 * Снимает сокет пользователя
 * @param userId - Идентификатор Telegram
 * @param ws - Соединение
 */
export function removeUserSupportSocket(userId: number, ws: WebSocket): void {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) userSockets.delete(userId);
}

/**
 * Регистрирует сокет админки
 * @param ws - Соединение
 */
export function addAdminSupportSocket(ws: WebSocket): void {
  adminSockets.add(ws);
}

/**
 * Снимает сокет админки
 * @param ws - Соединение
 */
export function removeAdminSupportSocket(ws: WebSocket): void {
  adminSockets.delete(ws);
}

/**
 * Локально рассылает событие владельцу диалога и всем админам этой реплики
 * @param userId - Владелец диалога
 * @param payload - JSON события
 */
export function fanOutSupportLocal(userId: number, payload: string): void {
  sendOpen(userSockets.get(userId), payload);
  sendOpen(adminSockets, payload);
}
