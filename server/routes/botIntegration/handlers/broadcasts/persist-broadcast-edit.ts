/** @fileoverview Сохранение подтверждённой правки конкретного сообщения рассылки. */
import { and, eq, sql } from "drizzle-orm";
import { botMessages } from "@shared/schema";
import { db } from "../../../../database/db";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
/**
 * Сохраняет только адресованные сообщения, затем уведомляет интерфейс.
 * @param projectId - Проект сообщения.
 * @param tokenId - Бот сообщения.
 * @param broadcastId - Рассылка в метаданных истории.
 * @param userId - Telegram ID получателя.
 * @param telegramMessageId - Подтверждённый адрес сообщения Telegram.
 * @param messageText - Подтверждённый новый текст.
 * @param buttons - Сохранённые кнопки рассылки.
 * @param buttonsPerRow - Сохранённая раскладка клавиатуры.
 * @returns Завершение синхронизации истории и событий.
 */
export async function persistBroadcastEdit(projectId: number, tokenId: number, broadcastId: number,
  userId: string, telegramMessageId: number, messageText: string,
  buttons: unknown[], buttonsPerRow: number | null) {
  const updated = await db.update(botMessages).set({ messageText }).where(and(
    eq(botMessages.projectId, projectId), eq(botMessages.tokenId, tokenId),
    eq(botMessages.userId, userId), eq(botMessages.telegramMessageId, telegramMessageId),
    eq(botMessages.messageType, "bot"),
    sql`${botMessages.messageData}->>'broadcastId' = ${String(broadcastId)}`,
  )).returning({ id: botMessages.id });
  if (!updated.length) throw new Error("Не найдена история сообщения с подтверждённым Telegram ID");
  for (const message of updated) {
    await broadcastProjectEvent(projectId, { type: "message-edited", projectId, tokenId,
      data: { messageId: message.id, userId, messageText, buttons, buttonsPerRow },
      timestamp: new Date().toISOString() });
  }
}
