/**
 * @fileoverview Отправка вывода процесса бота в активные WebSocket-терминалы
 * @module server/terminal/sendOutputToTerminals
 */

import { WebSocket } from "ws";
import { activeConnections } from "./activeConnections";
import { TerminalMessage } from "./TerminalMessage";
import { addToBuffer } from "./botLogsBuffer";

/**
 * Отправляет вывод в активные терминалы и добавляет строку в буфер логов
 * @param content - Содержимое вывода
 * @param type - Тип вывода: stdout, stderr или status
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param launchId - Идентификатор запуска (опционально)
 */
export function sendOutputToTerminals(
  content: string,
  type: "stdout" | "stderr" | "status",
  projectId: number,
  tokenId: number,
  launchId?: number
): void {
  const connectionKey = `${projectId}_${tokenId}`;
  const connections = activeConnections.get(connectionKey);

  if (connections) {
    const message: TerminalMessage = {
      type,
      content,
      projectId,
      tokenId,
      timestamp: new Date().toISOString(),
    };

    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  // Добавляем строку в буфер для последующей записи в БД
  addToBuffer(projectId, tokenId, content, type, launchId);
}
