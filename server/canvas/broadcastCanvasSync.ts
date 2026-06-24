/**
 * @fileoverview Рассылка canvas-sync всем клиентам комнаты проекта
 * @module server/canvas/broadcastCanvasSync
 */

import { WebSocket } from 'ws';
import type { CanvasSyncMessage } from '../../shared/canvas-sync/canvas-sync-message';
import { canvasConnections, canvasRoomKey } from './canvasConnections';

/**
 * Рассылает canvas-sync всем подключённым клиентам проекта, кроме отправителя
 * @param projectId - ID проекта
 * @param message - Сообщение синхронизации
 * @param excludeWs - WS отправителя (не получает echo)
 */
export function broadcastCanvasSync(
  projectId: number,
  message: CanvasSyncMessage,
  excludeWs?: WebSocket,
): void {
  const key = canvasRoomKey(projectId);
  const connections = canvasConnections.get(key);
  if (!connections?.size) return;

  const payload = JSON.stringify(message);
  for (const ws of connections) {
    if (ws === excludeWs) continue;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}
