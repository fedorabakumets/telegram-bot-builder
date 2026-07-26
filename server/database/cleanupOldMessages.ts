/**
 * @fileoverview Периодическая очистка старых сообщений по messages_retention_days
 *
 * Для каждого токена с N > 0 удаляет bot_messages старше N дней батчами.
 * message_activity_daily не трогает — длинный график аналитики сохраняется.
 *
 * @module server/database/cleanupOldMessages
 */

import { db } from "./db";
import { botTokens } from "@shared/schema";
import { sql, gt } from "drizzle-orm";

/** Интервал запуска очистки — каждый час */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/** Максимум строк, удаляемых за один проход по токену */
const BATCH_LIMIT = 5000;

/** Идентификатор таймера очистки */
let cleanupTimerId: ReturnType<typeof setInterval> | null = null;

/**
 * Удаляет устаревшие сообщения для токенов с включённым retention
 * @returns Суммарное число удалённых строк
 */
async function deleteExpiredMessages(): Promise<number> {
  const tokens = await db
    .select({
      id: botTokens.id,
      days: botTokens.messagesRetentionDays,
    })
    .from(botTokens)
    .where(gt(botTokens.messagesRetentionDays, 0));

  let totalDeleted = 0;

  for (const token of tokens) {
    const days = token.days ?? 0;
    if (days <= 0) continue;

    // Батчевое удаление, чтобы не держать длинную блокировку на больших таблицах
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await db.execute(sql`
        DELETE FROM bot_messages
        WHERE id IN (
          SELECT id FROM bot_messages
          WHERE token_id = ${token.id}
            AND created_at < NOW() - (${days} * INTERVAL '1 day')
          ORDER BY id
          LIMIT ${BATCH_LIMIT}
        )
      `);
      const deleted = result.rowCount ?? 0;
      totalDeleted += deleted;
      if (deleted < BATCH_LIMIT) break;
    }
  }

  return totalDeleted;
}

/**
 * Полный цикл очистки сообщений по retention токенов
 * @returns Promise<void>
 */
async function runCleanup(): Promise<void> {
  if ((globalThis as any).__dbPoolActive === false) return;

  try {
    const deleted = await deleteExpiredMessages();
    if (deleted > 0) {
      console.log(`[MessagesCleanup] Удалено устаревших сообщений: ${deleted}`);
    }
  } catch (err) {
    console.error("[MessagesCleanup] Ошибка очистки сообщений:", err);
  }
}

/**
 * Запускает периодическую очистку сообщений раз в час.
 * Первый запуск — через 2 минуты после старта (после логов).
 * @returns void
 */
export function startMessagesCleanupTimer(): void {
  if (cleanupTimerId !== null) return;

  setTimeout(() => {
    runCleanup();
    cleanupTimerId = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  }, 120 * 1000);

  console.log("[MessagesCleanup] Таймер очистки сообщений запущен (интервал: 1 час)");
}

/**
 * Останавливает таймер очистки сообщений
 * @returns void
 */
export function stopMessagesCleanupTimer(): void {
  if (cleanupTimerId !== null) {
    clearInterval(cleanupTimerId);
    cleanupTimerId = null;
  }
}
