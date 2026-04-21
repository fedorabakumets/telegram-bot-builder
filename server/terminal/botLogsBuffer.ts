/**
 * @fileoverview In-memory буфер логов ботов с батчингом в PostgreSQL
 * @module server/terminal/botLogsBuffer
 */

import { db } from "../database/db";
import { botLogs } from "@shared/schema";
import { sql } from "drizzle-orm";
import { startLogsCleanupTimer, stopLogsCleanupTimer } from "../database/cleanupOldLogs";
import type { StorageBotLogInput } from "../storages/storageTypes";

/** Структура слота буфера для одного процесса */
interface BufferSlot {
  /** Накопленные записи для вставки */
  entries: StorageBotLogInput[];
  /** Идентификатор текущего запуска */
  launchId?: number;
}

/** Буфер: ключ `${projectId}_${tokenId}` → слот с записями и launchId */
const buffer = new Map<string, BufferSlot>();

/** Идентификатор таймера периодического сброса */
let flushTimerId: ReturnType<typeof setInterval> | null = null;

/** Максимальное количество строк лога на один запуск */
const MAX_LOGS_PER_LAUNCH = 300;

/** Страховочный лимит строк на бота суммарно (все запуски) */
const MAX_LOGS_PER_BOT = 2000;

/** Интервал сброса буфера в миллисекундах */
const FLUSH_INTERVAL_MS = 5000;

/**
 * Добавляет строку лога в буфер
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param content - Содержимое строки лога
 * @param type - Тип строки лога
 * @param launchId - Идентификатор запуска (опционально)
 * @param timestamp - Временная метка (опционально, по умолчанию текущее время)
 */
export function addToBuffer(
  projectId: number,
  tokenId: number,
  content: string,
  type: "stdout" | "stderr" | "status",
  launchId?: number,
  timestamp?: string
): void {
  const key = `${projectId}_${tokenId}`;
  if (!buffer.has(key)) {
    buffer.set(key, { entries: [], launchId });
  }
  const slot = buffer.get(key)!;
  if (launchId !== undefined) slot.launchId = launchId;
  slot.entries.push({
    projectId,
    tokenId,
    content,
    type,
    launchId: slot.launchId,
    ...(timestamp ? { timestamp: new Date(timestamp) } : {}),
  });
}

/**
 * Сбрасывает буфер для указанного ключа в базу данных
 * @param processKey - Ключ процесса в формате `${projectId}_${tokenId}`
 * @returns Promise<void>
 */
export async function flushBuffer(processKey: string): Promise<void> {
  const slot = buffer.get(processKey);
  if (!slot || slot.entries.length === 0) return;

  const entries = slot.entries;
  buffer.set(processKey, { entries: [], launchId: slot.launchId });

  if (globalThis.__dbPoolActive === false) return;

  try {
    await db.insert(botLogs).values(entries);

    const [projectIdStr, tokenIdStr] = processKey.split("_");
    const projectId = parseInt(projectIdStr);
    const tokenId = parseInt(tokenIdStr);

    // Обрезаем по запуску если launchId известен
    if (slot.launchId !== undefined) {
      await trimLogsByLaunch(slot.launchId);
    }
    // Страховочная обрезка суммарно по боту
    await trimOldLogs(projectId, tokenId);
  } catch (err) {
    console.error(`[BotLogsBuffer] Ошибка сброса буфера для ${processKey}:`, err);
  }
}

/**
 * Удаляет старые записи конкретного запуска, оставляя MAX_LOGS_PER_LAUNCH строк
 * @param launchId - Идентификатор запуска
 * @returns Promise<void>
 */
async function trimLogsByLaunch(launchId: number): Promise<void> {
  try {
    await db.execute(sql`
      DELETE FROM bot_logs
      WHERE launch_id = ${launchId}
        AND id NOT IN (
          SELECT id FROM bot_logs
          WHERE launch_id = ${launchId}
          ORDER BY timestamp DESC
          LIMIT ${MAX_LOGS_PER_LAUNCH}
        )
    `);
  } catch (err) {
    console.error(`[BotLogsBuffer] Ошибка обрезки логов запуска ${launchId}:`, err);
  }
}

/**
 * Страховочная обрезка — удаляет старые записи, оставляя MAX_LOGS_PER_BOT строк на бота
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

  // Запускаем периодическую TTL-очистку логов
  startLogsCleanupTimer();

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
    stopLogsCleanupTimer();
    console.log("[BotLogsBuffer] Таймер сброса буфера остановлен");
  }
}

/**
 * Удаляет все логи бота из БД и очищает буфер.
 * Вызывается перед запуском нового экземпляра бота.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 */
export async function clearBotLogs(projectId: number, tokenId: number): Promise<void> {
  const key = `${projectId}_${tokenId}`;
  // Сначала сбрасываем буфер чтобы старые логи не записались в БД после очистки
  await flushBuffer(key);
  // Очищаем in-memory буфер
  buffer.delete(key);

  if (globalThis.__dbPoolActive === false) return;
  try {
    // Удаляем все live-логи — логи истории запросов через getBotLogsByLaunch по launchId
    await db.execute(sql`
      DELETE FROM bot_logs WHERE project_id = ${projectId} AND token_id = ${tokenId}
    `);
  } catch (err) {
    console.error(`[BotLogsBuffer] Ошибка очистки логов для ${key}:`, err);
  }
}
