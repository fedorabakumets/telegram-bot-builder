/**
 * @fileoverview In-memory буфер логов ботов с батчингом в PostgreSQL
 * @module server/terminal/botLogsBuffer
 */

import { db } from "../database/db";
import { botLogs } from "@shared/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import type { InsertBotLog } from "@shared/schema";

/** Буфер: ключ `${projectId}_${tokenId}` → массив записей для вставки */
const buffer = new Map<string, InsertBotLog[]>();

/** Идентификатор таймера периодического сброса */
let flushTimerId: ReturnType<typeof setInterval> | null = null;

/** Максимальное количество строк лога на бота */
const MAX_LOGS_PER_BOT = 500;

/** Интервал сброса буфера в миллисекундах */
const FLUSH_INTERVAL_MS = 5000;

/**
 * Добавляет строку лога в буфер
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param content - Содержимое строки лога
 * @param type - Тип строки лога
 */
export function addToBuffer(
  projectId: number,
  tokenId: number,
  content: string,
  type: "stdout" | "stderr" | "status"
): void {
  const key = `${projectId}_${tokenId}`;
  if (!buffer.has(key)) {
    buffer.set(key, []);
  }
  buffer.get(key)!.push({ projectId, tokenId, content, type });
}

/**
 * Сбрасывает буфер для указанного ключа в базу данных
 * @param processKey - Ключ процесса в формате `${projectId}_${tokenId}`
 * @returns Promise<void>
 */
export async function flushBuffer(processKey: string): Promise<void> {
  const entries = buffer.get(processKey);
  if (!entries || entries.length === 0) return;

  buffer.set(processKey, []);

  if (globalThis.__dbPoolActive === false) return;

  try {
    await db.insert(botLogs).values(entries);

    const [projectIdStr, tokenIdStr] = processKey.split("_");
    const projectId = parseInt(projectIdStr);
    const tokenId = parseInt(tokenIdStr);

    await trimOldLogs(projectId, tokenId);
  } catch (err) {
    console.error(`[BotLogsBuffer] Ошибка сброса буфера для ${processKey}:`, err);
  }
}

/**
 * Удаляет старые записи, оставляя только последние MAX_LOGS_PER_BOT строк
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @returns Promise<void>
 */
async function trimOldLogs(projectId: number, tokenId: number): Promise<void> {
  try {
    await db.execute(sql`
      DELETE FROM bot_logs
      WHERE project_id = ${projectId}
        AND token_id = ${tokenId}
        AND id NOT IN (
          SELECT id FROM bot_logs
          WHERE project_id = ${projectId}
            AND token_id = ${tokenId}
          ORDER BY timestamp DESC
          LIMIT ${MAX_LOGS_PER_BOT}
        )
    `);
  } catch (err) {
    console.error(`[BotLogsBuffer] Ошибка обрезки логов:`, err);
  }
}

/**
 * Запускает таймер периодического сброса буфера каждые 5 секунд
 * @returns void
 */
export function startFlushTimer(): void {
  if (flushTimerId !== null) return;

  flushTimerId = setInterval(async () => {
    for (const key of buffer.keys()) {
      await flushBuffer(key);
    }
  }, FLUSH_INTERVAL_MS);

  console.log("[BotLogsBuffer] Таймер сброса буфера запущен");
}

/**
 * Останавливает таймер периодического сброса буфера
 * @returns void
 */
export function stopFlushTimer(): void {
  if (flushTimerId !== null) {
    clearInterval(flushTimerId);
    flushTimerId = null;
    console.log("[BotLogsBuffer] Таймер сброса буфера остановлен");
  }
}
