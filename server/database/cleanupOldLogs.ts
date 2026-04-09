/**
 * @fileoverview Периодическая очистка старых логов ботов из таблицы bot_logs
 *
 * Стратегия комбо:
 * 1. Удаляет все записи старше TTL_DAYS дней
 * 2. Для каждого токена оставляет не более MAX_LOGS_PER_TOKEN самых новых строк
 *
 * @module server/database/cleanupOldLogs
 */

import { db } from "./db";
import { botLogs } from "@shared/schema";
import { sql, lt, and, eq, notInArray } from "drizzle-orm";

/** Срок жизни логов в днях — записи старше удаляются */
const TTL_DAYS = 7;

/** Максимальное количество строк лога на один токен */
const MAX_LOGS_PER_TOKEN = 5000;

/** Интервал запуска очистки — каждый час */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/** Идентификатор таймера очистки */
let cleanupTimerId: ReturnType<typeof setInterval> | null = null;

/**
 * Удаляет логи старше TTL_DAYS дней
 * @returns Количество удалённых записей
 */
async function deleteExpiredLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - TTL_DAYS * 24 * 60 * 60 * 1000);
  const result = await db.delete(botLogs).where(lt(botLogs.timestamp, cutoff));
  return result.rowCount ?? 0;
}

/**
 * Для каждого токена оставляет не более MAX_LOGS_PER_TOKEN самых новых строк
 * @returns Количество удалённых записей
 */
async function trimLogsByToken(): Promise<number> {
  // Получаем уникальные пары (project_id, token_id) у которых записей больше лимита
  const overLimitTokens = await db.execute<{ project_id: number; token_id: number }>(sql`
    SELECT project_id, token_id
    FROM bot_logs
    GROUP BY project_id, token_id
    HAVING COUNT(*) > ${MAX_LOGS_PER_TOKEN}
  `);

  let totalDeleted = 0;

  for (const row of overLimitTokens.rows) {
    const { project_id, token_id } = row;

    // Получаем ID записей которые нужно оставить
    const keepIds = await db.execute<{ id: number }>(sql`
      SELECT id FROM bot_logs
      WHERE project_id = ${project_id} AND token_id = ${token_id}
      ORDER BY timestamp DESC
      LIMIT ${MAX_LOGS_PER_TOKEN}
    `);

    const keepIdList = keepIds.rows.map(r => r.id);
    if (keepIdList.length === 0) continue;

    const result = await db.delete(botLogs).where(
      and(
        eq(botLogs.projectId, project_id),
        eq(botLogs.tokenId, token_id),
        notInArray(botLogs.id, keepIdList)
      )
    );
    totalDeleted += result.rowCount ?? 0;
  }

  return totalDeleted;
}

/**
 * Выполняет полный цикл очистки логов:
 * сначала по TTL, затем по лимиту на токен
 */
async function runCleanup(): Promise<void> {
  if ((globalThis as any).__dbPoolActive === false) return;

  try {
    const expiredDeleted = await deleteExpiredLogs();
    const trimDeleted = await trimLogsByToken();

    if (expiredDeleted > 0 || trimDeleted > 0) {
      console.log(`[LogsCleanup] Удалено: ${expiredDeleted} устаревших + ${trimDeleted} лишних записей`);
    }
  } catch (err) {
    console.error("[LogsCleanup] Ошибка очистки логов:", err);
  }
}

/**
 * Запускает периодическую очистку логов раз в час.
 * Первый запуск — через 1 минуту после старта сервера.
 */
export function startLogsCleanupTimer(): void {
  if (cleanupTimerId !== null) return;

  // Первый запуск через минуту чтобы не нагружать старт сервера
  setTimeout(() => {
    runCleanup();
    cleanupTimerId = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  }, 60 * 1000);

  console.log("[LogsCleanup] Таймер очистки логов запущен (интервал: 1 час, TTL: 7 дней, лимит: 5000/токен)");
}

/**
 * Останавливает таймер периодической очистки логов
 */
export function stopLogsCleanupTimer(): void {
  if (cleanupTimerId !== null) {
    clearInterval(cleanupTimerId);
    cleanupTimerId = null;
  }
}
