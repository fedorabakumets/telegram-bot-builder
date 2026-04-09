/**
 * @fileoverview Карта активных WebSocket-соединений.
 * Ключи: `${projectId}_${tokenId}` для терминала, `user_${userId}` для подписки на все проекты.
 * @module server/terminal/activeConnections
 */

import { WebSocket } from 'ws';

/**
 * Карта активных WebSocket-соединений.
 * Ключ `${projectId}_${tokenId}` — терминал конкретного бота.
 * Ключ `user_${userId}` — подписка на события всех проектов пользователя.
 */
export const activeConnections = new Map<string, Set<WebSocket>>();
