/**
 * @fileoverview Инициализация WebSocket-сервера для передачи вывода ботов.
 * Поддерживает режим подписки на все проекты пользователя (projectId=0).
 * @module server/terminal/initializeTerminalWebSocket
 */

import { WebSocket, WebSocketServer } from "ws";
import { activeConnections } from "./activeConnections";
import { setTerminalWss } from "./setTerminalWss";
import { setupBotProcessListeners } from "./setupBotProcessListeners";
import { startFlushTimer, flushBuffer } from "./botLogsBuffer";
import { storage } from "../storages/storage";
import { TerminalMessage } from "./TerminalMessage";
import { applyWebSocketSession } from "../websocket/applyWebSocketSession";
import "express-session";

/**
 * Регистрирует WebSocket-соединение в карте активных соединений
 * @param key - Ключ соединения
 * @param ws - WebSocket-соединение
 */
function registerConnection(key: string, ws: WebSocket): void {
  if (!activeConnections.has(key)) {
    activeConnections.set(key, new Set<WebSocket>());
  }
  activeConnections.get(key)!.add(ws);
}

/**
 * Удаляет WebSocket-соединение из карты активных соединений
 * @param key - Ключ соединения
 * @param ws - WebSocket-соединение
 */
function removeConnection(key: string, ws: WebSocket): void {
  const conns = activeConnections.get(key);
  if (conns) {
    conns.delete(ws);
    if (conns.size === 0) activeConnections.delete(key);
  }
}

/**
 * Инициализирует WebSocket-сервер для передачи вывода ботов.
 * Создаётся в режиме noServer — маршрутизация upgrade выполняется отдельно
 * (см. registerWebSocketUpgrade), чтобы не конфликтовать с другими ws-серверами.
 * При projectId=0 открывает соединение для всех проектов пользователя (ключ user_${userId}).
 * @returns Экземпляр WebSocket-сервера
 */
export function initializeTerminalWebSocket(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket, request) => {
    (async () => {
      try {
        // Прикрепляем Express-сессию к WS запросу чтобы получить userId.
        // Reject не должен молча ронять обработчик — оборачиваем в try/catch.
        await applyWebSocketSession(request);
      } catch (error) {
        console.error("[Terminal WS] Ошибка прикрепления сессии:", error);
        ws.close(1011, "Ошибка сервера при прикреплении сессии");
        return;
      }

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

      // Режим подписки на все проекты: projectId=0
      // В single-tenant режиме без авторизации используем глобальный ключ
      if (projectId === 0) {
        const session = (request as any).session;
        const userId: number | undefined = session?.telegramUser?.id;
        const allKey = userId ? `user_${userId}` : `user_global`;
        registerConnection(allKey, ws);

        // Отвечаем на ping чтобы Railway не закрыл idle соединение
        ws.on("message", (data) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.command === 'ping') {
              ws.send(JSON.stringify({ command: 'pong' }));
            }
          } catch {
            // Игнорируем некорректные сообщения
          }
        });

        ws.on("close", () => removeConnection(allKey, ws));
        ws.on("error", (err) => {
          console.error(`[Terminal WS] Ошибка соединения подписки key=${allKey}:`, err);
          removeConnection(allKey, ws);
        });
        return;
      }

      const connectionKey = `${projectId}_${tokenId}`;
      registerConnection(connectionKey, ws);
      console.log(`[Terminal WS] Зарегистрировано соединение: key=${connectionKey}, всего соединений для ключа: ${activeConnections.get(connectionKey)?.size ?? 0}`);

      // Сбрасываем буфер и отправляем историю асинхронно
      (async () => {
        await flushBuffer(connectionKey);
        sendHistoryToClient(ws, projectId, tokenId);
      })();

      ws.on("close", () => {
        console.log(`WebSocket закрыт для проекта ${projectId}, токена ${tokenId}`);
        removeConnection(connectionKey, ws);
      });

      ws.on("error", (error) => {
        console.error(`Ошибка WebSocket для проекта ${projectId}, токена ${tokenId}:`, error);
        removeConnection(connectionKey, ws);
      });

      ws.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.command === "clear") {
            console.log(`Команда очистки терминала для проекта ${projectId}, токена ${tokenId}`);
          } else if (parsed.command === "ping") {
            ws.send(JSON.stringify({ command: "pong" }));
          }
        } catch {
          console.warn("Некорректное сообщение от клиента:", data.toString());
        }
      });
    })();
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
 * Загружает логи только последнего запуска из БД и отправляет клиенту
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
    const logs = await storage.getLatestLaunchLogs(projectId, tokenId, 500);
    for (const log of logs) {
      if (ws.readyState !== WebSocket.OPEN) break;
      const message: TerminalMessage = {
        type: (log.type as "stdout" | "stderr" | "status") ?? "stdout",
        content: log.content,
        projectId,
        tokenId,
        timestamp: log.timestamp?.toISOString() ?? new Date().toISOString(),
        logId: log.id,
      };
      ws.send(JSON.stringify(message));
    }
  } catch (err) {
    console.error(`[Terminal] Ошибка загрузки истории логов для ${projectId}_${tokenId}:`, err);
  }
}
