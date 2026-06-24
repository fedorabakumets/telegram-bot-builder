/**
 * @fileoverview Карта WebSocket-соединений синхронизации холста
 * @module server/canvas/canvasConnections
 */

import type { WebSocket } from 'ws';

/**
 * Активные WS-соединения холста.
 * Ключ: `canvas_${projectId}`
 */
export const canvasConnections = new Map<string, Set<WebSocket>>();

/**
 * Формирует ключ комнаты холста
 * @param projectId - ID проекта
 * @returns Ключ комнаты
 */
export function canvasRoomKey(projectId: number): string {
  return `canvas_${projectId}`;
}

/**
 * Регистрирует соединение в комнате проекта
 * @param key - Ключ комнаты
 * @param ws - WebSocket-соединение
 */
export function registerCanvasConnection(key: string, ws: WebSocket): void {
  if (!canvasConnections.has(key)) {
    canvasConnections.set(key, new Set());
  }
  canvasConnections.get(key)!.add(ws);
}

/**
 * Удаляет соединение из комнаты
 * @param key - Ключ комнаты
 * @param ws - WebSocket-соединение
 */
export function removeCanvasConnection(key: string, ws: WebSocket): void {
  const conns = canvasConnections.get(key);
  if (!conns) return;
  conns.delete(ws);
  if (conns.size === 0) {
    canvasConnections.delete(key);
  }
}
