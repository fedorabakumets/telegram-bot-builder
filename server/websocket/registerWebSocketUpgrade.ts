/**
 * @fileoverview Единый маршрутизатор WebSocket upgrade-запросов по пути.
 *
 * Решает конфликт нескольких WebSocketServer на одном HTTP-сервере:
 * при использовании опции `{ server, path }` каждый ws-сервер уничтожает
 * сокеты с неподходящим путём (abortHandshake), что ломает handshake других
 * серверов и приводит к ошибке "Invalid frame header" / code=1006.
 *
 * Решение: все ws-серверы создаются в режиме `noServer: true`, а маршрутизацию
 * upgrade по pathname выполняет один обработчик. Неизвестные пути (например
 * Vite HMR) не уничтожаются — их обрабатывают другие слушатели upgrade.
 *
 * @module server/websocket/registerWebSocketUpgrade
 */

import type { Server as HttpServer } from "node:http";
import type { WebSocketServer, WebSocket } from "ws";

/** Карта соответствия путей и WebSocket-серверов */
export interface WebSocketUpgradeRoutes {
  /** Путь запроса (pathname без query), например "/api/terminal" */
  [pathname: string]: WebSocketServer;
}

/**
 * Регистрирует единый обработчик upgrade, маршрутизирующий запросы по pathname.
 *
 * Для совпавшего пути выполняет handleUpgrade соответствующего ws-сервера и
 * эмитит на нём событие "connection". Для несовпавших путей ничего не делает —
 * сокет остаётся доступным другим слушателям upgrade (Vite HMR и пр.).
 *
 * @param server - HTTP-сервер, к которому привязаны WebSocket-соединения
 * @param routes - Карта "pathname → WebSocketServer"
 */
export function registerWebSocketUpgrade(
  server: HttpServer,
  routes: WebSocketUpgradeRoutes
): void {
  server.on("upgrade", (req, socket, head) => {
    // Безопасно вычисляем pathname (req.url может содержать query)
    const pathname = new URL(req.url ?? "", "http://localhost").pathname;
    const wss = routes[pathname];
    if (!wss) {
      // Путь не наш — не трогаем сокет, его обработают другие слушатели (Vite HMR)
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
      wss.emit("connection", ws, req);
    });
  });
}
