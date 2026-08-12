/**
 * @fileoverview Общая операция удаления сообщений одной рассылки из Telegram и истории диалогов.
 * Саму запись рассылки не удаляет — это решает вызывающий код
 * @module botIntegration/handlers/broadcasts/delete-broadcast-messages
 */

import { eq, and, sql, isNotNull } from "drizzle-orm";
import { db } from "../../../../database/db";
import { broadcastResults, botMessages, botTokens } from "@shared/schema";
import {
  deleteTelegramBroadcastMessage,
  throttleBroadcastTelegramOps,
} from "./broadcast-telegram-ops";

/**
 * Удаляет отправленные сообщения рассылки у получателей в Telegram
 * и очищает их из истории диалогов проекта
 * @param projectId - ID проекта
 * @param broadcastId - ID рассылки
 * @param tokenId - ID токена бота рассылки
 * @returns Количество сообщений, для которых запрашивалось удаление
 */
export async function deleteBroadcastMessages(
  projectId: number,
  broadcastId: number,
  tokenId: number,
): Promise<number> {
  const [tokenRecord] = await db
    .select()
    .from(botTokens)
    .where(and(eq(botTokens.id, tokenId), eq(botTokens.projectId, projectId)));

  const results = await db
    .select()
    .from(broadcastResults)
    .where(and(eq(broadcastResults.broadcastId, broadcastId), isNotNull(broadcastResults.telegramMessageId)));

  if (tokenRecord?.token && results.length > 0) {
    for (const r of results) {
      await deleteTelegramBroadcastMessage(tokenRecord.token, r.userId, r.telegramMessageId!);
      await throttleBroadcastTelegramOps(results.length);
    }
  }

  await db
    .delete(botMessages)
    .where(
      and(
        eq(botMessages.projectId, projectId),
        sql`${botMessages.messageData}->>'broadcastId' = ${String(broadcastId)}`,
      ),
    );

  return results.length;
}
