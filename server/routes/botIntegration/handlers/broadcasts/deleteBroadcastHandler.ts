/**
 * @fileoverview Хендлер удаления рассылки — удаляет сообщения из Telegram и из БД
 * @module botIntegration/handlers/broadcasts/deleteBroadcastHandler
 */

import type { Request, Response } from "express";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { db } from "../../../../database/db";
import { broadcasts, broadcastResults, botMessages, botTokens } from "@shared/schema";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Удаляет сообщение рассылки из Telegram у конкретного получателя
 * @param token - Токен бота
 * @param chatId - Telegram user_id получателя
 * @param messageId - ID сообщения в Telegram
 */
async function deleteTelegramMessage(token: string, chatId: string, messageId: number): Promise<void> {
  try {
    const url = `https://api.telegram.org/bot${token}/deleteMessage`;
    await fetchWithProxy(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
  } catch (err) {
    console.warn(`[deleteBroadcast] Не удалось удалить сообщение ${messageId} у ${chatId}:`, err);
  }
}

/**
 * Обрабатывает DELETE /api/projects/:projectId/broadcasts/:broadcastId
 * Удаляет сообщения из Telegram у получателей, затем рассылку и связанные записи из БД
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function deleteBroadcastHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    const broadcastId = Number.parseInt(req.params.broadcastId, 10);

    if (Number.isNaN(projectId) || Number.isNaN(broadcastId)) {
      res.status(400).json({ message: "Неверные параметры запроса" });
      return;
    }

    // Получаем рассылку чтобы узнать tokenId
    const [broadcast] = await db
      .select()
      .from(broadcasts)
      .where(and(eq(broadcasts.id, broadcastId), eq(broadcasts.projectId, projectId)));

    if (!broadcast) {
      res.status(404).json({ message: "Рассылка не найдена" });
      return;
    }

    // Получаем токен бота
    const [tokenRecord] = await db
      .select()
      .from(botTokens)
      .where(eq(botTokens.id, broadcast.tokenId));

    // Получаем результаты с telegramMessageId для удаления из Telegram
    const results = await db
      .select()
      .from(broadcastResults)
      .where(and(eq(broadcastResults.broadcastId, broadcastId), isNotNull(broadcastResults.telegramMessageId)));

    // Удаляем сообщения из Telegram (ошибки не прерывают процесс)
    if (tokenRecord?.token && results.length > 0) {
      for (const r of results) {
        await deleteTelegramMessage(tokenRecord.token, r.userId, r.telegramMessageId!);
      }
    }

    // Удаляем рассылку из БД (каскадно удалит broadcast_results)
    await db.delete(broadcasts).where(eq(broadcasts.id, broadcastId));

    // Удаляем связанные сообщения из bot_messages
    await db
      .delete(botMessages)
      .where(
        and(
          eq(botMessages.projectId, projectId),
          sql`${botMessages.messageData}->>'broadcastId' = ${String(broadcastId)}`
        )
      );

    res.json({ ok: true, deleted: results.length });
  } catch (error) {
    console.error("[deleteBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
