/**
 * @fileoverview Рассылка лёгкого сигнала «история версий изменилась» в комнату проекта.
 * @description Вызывается после удаления/prune/commit версий: формирует
 * versions-changed и рассылает напрямую всем WS-клиентам комнаты canvas_<projectId>.
 * Не использует строго типизированный broadcastCanvasSync (тот принимает только
 * CanvasSyncMessage), поэтому цикл рассылки продублирован как в broadcastCanvasSync.ts.
 * @module server/canvas/broadcastVersionsChanged
 */

import { WebSocket } from 'ws';
import type { CanvasVersionsChangedMessage } from '../../shared/canvas-sync/canvas-versions-changed-message';
import { canvasConnections, canvasRoomKey } from './canvasConnections';

/**
 * Вещает сигнал об изменении истории версий всем клиентам комнаты проекта.
 * @param projectId - ID проекта, чья история версий изменилась
 */
export function broadcastVersionsChanged(projectId: number): void {
  const key = canvasRoomKey(projectId);
  const connections = canvasConnections.get(key);
  if (!connections?.size) return;

  const message: CanvasVersionsChangedMessage = {
    type: 'versions-changed',
    projectId,
    timestamp: Date.now(),
  };
  const payload = JSON.stringify(message);
  for (const ws of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}
