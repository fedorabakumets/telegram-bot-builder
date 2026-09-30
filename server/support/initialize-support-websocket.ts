/**
 * @fileoverview WebSocket чата поддержки: пользователь и админка
 * @module server/support/initialize-support-websocket
 */

import type { IncomingMessage } from "node:http";
import type { Request } from "express";
import { WebSocket, WebSocketServer } from "ws";
import { isAdminAuthenticated } from "../admin/admin-auth-middleware";
import { applyWebSocketSession } from "../websocket/applyWebSocketSession";
import {
  addAdminSupportSocket,
  addUserSupportSocket,
  removeAdminSupportSocket,
  removeUserSupportSocket,
} from "./support-connections";

/** Сокет пользователя Studio */
const USER_PATH = "/api/support/ws";

/** Сокет админки. Путь под /admin, чтобы ушла cookie admin_auth */
const ADMIN_PATH = "/admin/api/support/ws";

/**
 * Достаёт pathname из upgrade-запроса
 * @param request - HTTP upgrade
 * @returns Путь без query
 */
function requestPath(request: IncomingMessage): string {
  return new URL(request.url ?? "", "http://localhost").pathname;
}

/**
 * Отвечает pong на ping этого сокета
 * @param ws - Соединение
 */
function bindPing(ws: WebSocket): void {
  ws.on("message", (raw) => {
    try {
      const parsed = JSON.parse(raw.toString()) as { type?: string };
      if (parsed.type === "ping" && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "pong" }));
      }
    } catch {
      // Некорректный кадр не рвёт соединение
    }
  });
}

/**
 * Принимает админское соединение по cookie admin_auth
 * @param ws - Соединение
 * @param request - HTTP upgrade
 * @returns true, если путь админский и соединение разобрано
 */
function acceptAdmin(ws: WebSocket, request: IncomingMessage): boolean {
  if (requestPath(request) !== ADMIN_PATH) return false;
  if (!isAdminAuthenticated(request as Request)) {
    ws.close(4001, "Нет доступа");
    return true;
  }
  addAdminSupportSocket(ws);
  bindPing(ws);
  ws.on("close", () => removeAdminSupportSocket(ws));
  ws.on("error", () => removeAdminSupportSocket(ws));
  return true;
}

/**
 * Принимает соединение пользователя по сессии Telegram
 * @param ws - Соединение
 * @param request - HTTP upgrade
 */
async function acceptUser(ws: WebSocket, request: IncomingMessage): Promise<void> {
  await applyWebSocketSession(request);
  const userId = (request as { session?: { telegramUser?: { id?: number } } }).session?.telegramUser?.id;
  if (!userId) {
    ws.close(4001, "Нет доступа");
    return;
  }
  addUserSupportSocket(userId, ws);
  bindPing(ws);
  ws.on("close", () => removeUserSupportSocket(userId, ws));
  ws.on("error", () => removeUserSupportSocket(userId, ws));
}

/**
 * Создаёт WebSocketServer без собственного upgrade.
 * Один сервер вешается на /api/support/ws и /admin/api/support/ws.
 * @returns WebSocketServer
 */
export function initializeSupportWebSocket(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
    void (async () => {
      try {
        if (acceptAdmin(ws, request)) return;
        await acceptUser(ws, request);
      } catch (err) {
        console.error("[support-ws] Ошибка подключения:", err);
        ws.close(1011, "Ошибка сервера");
      }
    })();
  });

  return wss;
}
