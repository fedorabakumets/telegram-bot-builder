/**
 * @fileoverview Общая операция редактирования одной рассылки:
 * правка сообщений в Telegram, обновление БД и WS-события
 * @module botIntegration/handlers/broadcasts/edit-broadcast-messages
 */

import { eq, and, sql, isNotNull } from "drizzle-orm";
import { db } from "../../../../database/db";
import { broadcasts, broadcastResults, botMessages, botTokens } from "@shared/schema";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
import {
  editTelegramBroadcastMessage,
  throttleBroadcastTelegramOps,
} from "./broadcast-telegram-ops";

/** Статистика редактирования сообщений рассылки */
export interface BroadcastEditStats {
  /** Успешно отредактировано сообщений в Telegram */
  edited: number;
  /** Не удалось отредактировать */
  failed: number;
}

/**
 * Редактирует текст всех отправленных сообщений рассылки в Telegram,
 * обновляет запись рассылки, историю диалогов и рассылает WS-события
 * @param projectId - ID проекта
 * @param broadcastId - ID рассылки
 * @param tokenId - ID токена бота рассылки
 * @param messageText - Новый HTML-текст
 * @returns Количество успешных и неуспешных правок
 */
export async function editBroadcastMessages(
  projectId: number,
  broadcastId: number,
  tokenId: number,
  messageText: string,
): Promise<BroadcastEditStats> {
  const [tokenRecord] = await db
    .select()
    .from(botTokens)
    .where(and(eq(botTokens.id, tokenId), eq(botTokens.projectId, projectId)));

  const results = await db
    .select()
    .from(broadcastResults)
    .where(and(eq(broadcastResults.broadcastId, broadcastId), isNotNull(broadcastResults.telegramMessageId)));

  let edited = 0;
  let failed = 0;

  if (tokenRecord?.token && results.length > 0) {
    for (const r of results) {
      const ok = await editTelegramBroadcastMessage(
        tokenRecord.token,
        r.userId,
        r.telegramMessageId!,
        messageText,
      );
      if (ok) edited++;
      else failed++;
      await throttleBroadcastTelegramOps(results.length);
    }
  }

  await db.update(broadcasts).set({ messageText }).where(eq(broadcasts.id, broadcastId));

  await db
    .update(botMessages)
    .set({ messageText })
    .where(
      and(
        eq(botMessages.projectId, projectId),
        sql`${botMessages.messageData}->>'broadcastId' = ${String(broadcastId)}`,
      ),
    );

  const allResults = await db
    .select()
    .from(broadcastResults)
    .where(eq(broadcastResults.broadcastId, broadcastId));

  for (const r of allResults) {
    await broadcastProjectEvent(projectId, {
      type: "message-edited",
      projectId,
      tokenId,
      data: { messageId: 0, userId: r.userId, messageText },
      timestamp: new Date().toISOString(),
    });
  }

  return { edited, failed };
}
