import { WebSocket } from 'ws';

/**
 * Карта активных WebSocket-соединений для каждого проекта/токена
 * @type {Map<string, Set<WebSocket>>}
 */

export const activeConnections = new Map<string, Set<WebSocket>>();
