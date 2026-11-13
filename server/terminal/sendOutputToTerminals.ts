/**
 * @fileoverview Отправка вывода процесса бота в активные WebSocket-терминалы
 * @module server/terminal/sendOutputToTerminals
 */

import { authorizedFanout } from "./authorized-fanout";
import { redactSecrets } from "../utils/redactSecrets";
import { TerminalMessage } from "./TerminalMessage";
import { persistLogLine } from "./botLogsBuffer";

/**
 * Парсит timestamp из строки лога Python-формата: "2026-04-09 11:00:16,191 - ..."
 * Если строка не содержит timestamp — возвращает текущее время.
 * @param content - Строка лога
 * @returns ISO-строка времени
 */
function parseLogTimestamp(content: string): string {
  const match = content.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),(\d+)/);
  if (match) {
    const iso = `${match[1]}.${match[2]}`;
    const date = new Date(iso);
    if (!isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

/**
 * Сохраняет лог в bot_logs и отправляет вывод в активные терминалы
 * @param content - Содержимое вывода
 * @param type - Тип вывода: stdout, stderr или status
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param launchId - Идентификатор запуска (опционально)
 */
export async function sendOutputToTerminals(
  content: string,
  type: "stdout" | "stderr" | "status",
  projectId: number,
  tokenId: number,
  launchId?: number
): Promise<void> {
  content = redactSecrets(content);
  /** Ограничения Telegram меняет структурированный наблюдатель, а не произвольный текст лога. */
  const timestamp = type === "stdout" || type === "stderr"
    ? parseLogTimestamp(content)
    : new Date().toISOString();

  const logId = await persistLogLine(projectId, tokenId, content, type, launchId, timestamp);

  const message: TerminalMessage = {
    type,
    content,
    projectId,
    tokenId,
    timestamp,
    ...(logId !== undefined ? { logId } : {}),
  };

  await authorizedFanout(JSON.stringify(message), projectId, tokenId);
}
