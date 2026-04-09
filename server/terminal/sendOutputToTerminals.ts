/**
 * @fileoverview Отправка вывода процесса бота в активные WebSocket-терминалы
 * @module server/terminal/sendOutputToTerminals
 */

import { WebSocket } from "ws";
import { activeConnections } from "./activeConnections";
import { TerminalMessage } from "./TerminalMessage";
import { addToBuffer } from "./botLogsBuffer";

/**
 * Парсит timestamp из строки лога Python-формата: "2026-04-09 11:00:16,191 - ..."
 * Если строка не содержит timestamp — возвращает текущее время.
 * @param content - Строка лога
 * @returns ISO-строка времени
 */
function parseLogTimestamp(content: string): string {
  const match = content.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),(\d+)/);
  if (match) {
    // Заменяем запятую на точку для корректного парсинга миллисекунд
    const iso = `${match[1]}.${match[2]}`;
    const date = new Date(iso);
    if (!isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

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
  const timestamp = type === "stdout" || type === "stderr"
    ? parseLogTimestamp(content)
    : new Date().toISOString();

  if (connections) {
    const message: TerminalMessage = {
      type,
      content,
      projectId,
      tokenId,
      timestamp,
    };

    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  // Добавляем строку в буфер для последующей записи в БД
  addToBuffer(projectId, tokenId, content, type, launchId, timestamp);
}
