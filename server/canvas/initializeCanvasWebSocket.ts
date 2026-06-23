/**
 * @fileoverview WebSocket-сервер live-синхронизации холста (/api/canvas)
 * @module server/canvas/initializeCanvasWebSocket
 */

import type { Server as HttpServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { exportedSessionMiddleware } from '../routes/routes';
import { storage } from '../storages/storage';
import type { TelegramUserDB } from '@shared/schema';
import { isCanvasSyncMessage } from '../../shared/canvas-sync/canvas-sync-message';
import {
  canvasRoomKey,
  registerCanvasConnection,
  removeCanvasConnection,
} from './canvasConnections';
import { broadcastCanvasSync } from './broadcastCanvasSync';
import { enrichCanvasActor } from './enrichCanvasActor';
import 'express-session';

/**
 * Прикрепляет Express-сессию к WebSocket-запросу
 * @param request - HTTP upgrade request
 */
function applySession(request: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!exportedSessionMiddleware) {
      resolve();
      return;
    }
    exportedSessionMiddleware(request as never, {} as never, (error?: unknown) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

/**
 * Инициализирует WebSocket для синхронизации холста между устройствами и коллабораторами
 * @param server - HTTP-сервер
 * @returns WebSocketServer
 */
export function initializeCanvasWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/api/canvas' });

  wss.on('connection', (ws: WebSocket, request) => {
    (async () => {
      try {
        await applySession(request);

        const urlParams = new URLSearchParams(request.url?.split('?')[1]);
        const projectId = parseInt(urlParams.get('projectId') ?? '', 10);
        if (Number.isNaN(projectId)) {
          ws.close(4001, 'projectId обязателен');
          return;
        }

        const session = (request as { session?: { telegramUser?: TelegramUserDB } }).session;
        const sessionUser = session?.telegramUser;
        const userId = sessionUser?.id;

        if (userId != null) {
          const hasAccess = await storage.hasProjectAccess(projectId, userId);
          if (!hasAccess) {
            ws.close(4003, 'Нет доступа к проекту');
            return;
          }
        }

        const roomKey = canvasRoomKey(projectId);
        registerCanvasConnection(roomKey, ws);
        console.log(`[Canvas WS] Подключён projectId=${projectId}, userId=${userId ?? 'guest'}, room=${roomKey}`);

        ws.on('message', (raw) => {
          try {
            const parsed = JSON.parse(raw.toString()) as unknown;
            if (typeof parsed === 'object' && parsed !== null && (parsed as { type?: string }).type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong' }));
              return;
            }
            if (!isCanvasSyncMessage(parsed)) return;
            if (parsed.projectId !== projectId) return;

            const actor = enrichCanvasActor(sessionUser, parsed.actor, parsed.tabId);
            const outbound = { ...parsed, actor, userId: actor.userId };
            broadcastCanvasSync(projectId, outbound, ws);
          } catch {
            // Игнорируем некорректные сообщения
          }
        });

        ws.on('close', () => removeCanvasConnection(roomKey, ws));
        ws.on('error', () => removeCanvasConnection(roomKey, ws));
      } catch (error) {
        console.error('[Canvas WS] Ошибка подключения:', error);
        ws.close(1011, 'Ошибка сервера');
      }
    })();
  });

  console.log('WebSocket-сервер синхронизации холста: /api/canvas');
  return wss;
}
