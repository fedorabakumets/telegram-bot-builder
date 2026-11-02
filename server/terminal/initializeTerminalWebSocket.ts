/** @fileoverview Общий WebSocket с обязательной сессией, правами проекта и принадлежностью бота. */
import { WebSocket, WebSocketServer } from 'ws';
import { activeConnections } from './activeConnections';
import { setTerminalWss } from './setTerminalWss';
import { setupBotProcessListeners } from './setupBotProcessListeners';
import { startFlushTimer, flushBuffer } from './botLogsBuffer';
import { applyWebSocketSession } from '../websocket/applyWebSocketSession';
import { authorizeTerminal, sendAuthorizedTerminal } from './terminal-access';
import { sendTerminalHistory } from './terminal-history';
import { analyticsTransportStatus } from '../analytics/live-status';
/** Удаляет закрытое соединение из карты подписок. */
function removeConnection(key: string, ws: WebSocket): void {
  const connections = activeConnections.get(key);
  connections?.delete(ws);
  if (!connections?.size) activeConnections.delete(key);
}
/** Инициализирует сервер; HTTP upgrade маршрутизируется общим обработчиком. */
export function initializeTerminalWebSocket(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
  wss.on('connection', (ws, request) => {
    void (async () => {
      await applyWebSocketSession(request);
      const scope = await authorizeTerminal(ws, request);
      if (!scope) { ws.close(4003, 'Требуется авторизация и доступ к проекту'); return; }
      if (ws.readyState !== WebSocket.OPEN) return;
      const key = scope.projectId ? `${scope.projectId}_${scope.tokenId}` : `user_${scope.userId}`;
      if (!activeConnections.has(key)) activeConnections.set(key, new Set());
      activeConnections.get(key)!.add(ws);
      ws.on('close', () => removeConnection(key, ws));
      ws.on('error', () => removeConnection(key, ws));
      ws.on('message', data => {
        try {
          if (JSON.parse(data.toString()).command === 'ping') {
            void sendAuthorizedTerminal(ws, JSON.stringify({ command: 'pong' }));
          }
        } catch { /* Некорректные сообщения не содержат допустимых команд. */ }
      });
      await sendAuthorizedTerminal(ws, JSON.stringify(analyticsTransportStatus()));
      if (scope.projectId && scope.tokenId) {
        await flushBuffer(key);
        await sendTerminalHistory(ws, scope.projectId, scope.tokenId);
      }
    })().catch(() => ws.close(1011, 'Не удалось проверить подключение'));
  });
  wss.on('error', () => console.error('[Terminal WS] Ошибка сервера соединений'));
  setupBotProcessListeners();
  startFlushTimer();
  setTerminalWss(wss);
  return wss;
}
