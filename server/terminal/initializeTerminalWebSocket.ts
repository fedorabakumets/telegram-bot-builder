/**
 * @fileoverview Инициализация WebSocket-сервера для передачи вывода ботов
 * @module server/terminal/initializeTerminalWebSocket
 */

import { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { activeConnections } from "./activeConnections";
import { setTerminalWss } from "./setTerminalWss";
import { setupBotProcessListeners } from "./setupBotProcessListeners";
import { startFlushTimer } from "./botLogsBuffer";
import { storage } from "../storages/storage";
import { TerminalMessage } from "./TerminalMessage";

/**
 * Инициализирует WebSocket-сервер для передачи вывода ботов
 * @param server - HTTP-сервер, к которому будет подключён WebSocket
 * @returns Экземпляр WebSocket-сервера
 */
export function initializeTerminalWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/api/terminal" });

  wss.on("connection", (ws: WebSocket, request) => {
    console.log("Новое WebSocket-соединение для терминала");

    const urlParams = new URLSearchParams(request.url?.split("?")[1]);
    const projectIdStr = urlParams.get("projectId");
    const tokenIdStr = urlParams.get("tokenId");

    if (!projectIdStr || !tokenIdStr) {
      console.error("Отсутствуют обязательные параметры projectId или tokenId");
      ws.close(4001, "Отсутствуют обязательные параметры");
      return;
    }

    const projectId = parseInt(projectIdStr);
    const tokenId = parseInt(tokenIdStr);
    const connectionKey = `${projectId}_${tokenId}`;

    // Регистрируем соединение
    if (!activeConnections.has(connectionKey)) {
      activeConnections.set(connectionKey, new Set<WebSocket>());
    }
    activeConnections.get(connectionKey)!.add(ws);

    // Отправляем историю логов новому клиенту
    sendHistoryToClient(ws, projectId, tokenId);

    ws.on("close", () => {
      console.log(`WebSocket закрыт для проекта ${projectId}, токена ${tokenId}`);
      const conns = activeConnections.get(connectionKey);
      if (conns) {
        conns.delete(ws);
        if (conns.size === 0) activeConnections.delete(connectionKey);
      }
    });

    ws.on("error", (error) => {
      console.error(`Ошибка WebSocket для проекта ${projectId}, токена ${tokenId}:`, error);
      const conns = activeConnections.get(connectionKey);
      if (conns) {
        conns.delete(ws);
        if (conns.size === 0) activeConnections.delete(connectionKey);
      }
    });

    ws.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.command === "clear") {
          console.log(`Команда очистки терминала для проекта ${projectId}, токена ${tokenId}`);
        }
      } catch {
        console.warn("Некорректное сообщение от клиента:", data.toString());
      }
    });
  });

  wss.on("error", (error) => {
    console.error("Ошибка WebSocket-сервера:", error);
  });

  setupBotProcessListeners();
  startFlushTimer();
  setTerminalWss(wss);

  console.log("WebSocket-сервер для терминала инициализирован на /api/terminal");
  return wss;
}

/**
 * Загружает историю логов из БД и отправляет её клиенту
 * @param ws - WebSocket-соединение клиента
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 */
async function sendHistoryToClient(
  ws: WebSocket,
  projectId: number,
  tokenId: number
): Promise<void> {
  try {
    const logs = await storage.getBotLogs(projectId, tokenId, 500);
    for (const log of logs) {
      if (ws.readyState !== WebSocket.OPEN) break;
      const message: TerminalMessage = {
        type: (log.type as "stdout" | "stderr" | "status") ?? "stdout",
        content: log.content,
        projectId,
        tokenId,
        timestamp: log.timestamp?.toISOString() ?? new Date().toISOString(),
      };
      ws.send(JSON.stringify(message));
    }
  } catch (err) {
    console.error(`[Terminal] Ошибка загрузки истории логов для ${projectId}_${tokenId}:`, err);
  }
}
