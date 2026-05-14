/**
 * @fileoverview Хендлер редактирования рассылки — обновляет текст в Telegram и в БД
 * @module botIntegration/handlers/broadcasts/editBroadcastHandler
 */

import type { Request, Response } from "express";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { db } from "../../../../database/db";
import { broadcasts, broadcastResults, botMessages, botTokens } from "@shared/schema";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Редактирует текст сообщения рассылки в Telegram у конкретного получателя
 * @param token - Токен бота
 * @param chatId - Telegram user_id получателя
 * @param messageId - ID сообщения в Telegram
 * @param newText - Новый текст сообщения (HTML)
 * @returns true если успешно, false если ошибка
 */
async function editTelegramMessage(
  token: string,
  chatId: string,
  messageId: number,
  newText: string,
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${token}/editMessageText`;
    const response = await fetchWithProxy(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        parse_mode: "HTML",
      }),
    });
    const json = await response.json() as { ok?: boolean };
    return json.ok === true;
  } catch (err) {
    console.warn(`[editBroadcast] Не удалось отредактировать сообщение ${messageId} у ${chatId}:`, err);
    return false;
  }
}

/**
 * Обрабатывает PUT /api/projects/:projectId/broadcasts/:broadcastId
 * Редактирует текст рассылки в Telegram у получателей и обновляет БД
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function editBroadcastHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    const broadcastId = Number.parseInt(req.params.broadcastId, 10);
    const { messageText } = req.body as { messageText?: string };

    if (Number.isNaN(projectId) || Number.isNaN(broadcastId) || !messageText?.trim()) {
      res.status(400).json({ message: "Неверные параметры запроса" });
      return;
    }

    // Получаем рассылку
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

    // Получаем результаты с telegramMessageId
    const results = await db
      .select()
      .from(broadcastResults)
      .where(and(eq(broadcastResults.broadcastId, broadcastId), isNotNull(broadcastResults.telegramMessageId)));

    let edited = 0;
    let failed = 0;

    // Редактируем сообщения в Telegram
    if (tokenRecord?.token && results.length > 0) {
      for (const r of results) {
        const ok = await editTelegramMessage(tokenRecord.token, r.userId, r.telegramMessageId!, messageText);
        if (ok) edited++;
        else failed++;
        // Throttle: 25 запросов в секунду
        if (results.length > 25) {
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
      }
    }

    // Обновляем текст рассылки в БД
    await db
      .update(broadcasts)
      .set({ messageText })
      .where(eq(broadcasts.id, broadcastId));

    // Обновляем связанные bot_messages
    await db
      .update(botMessages)
      .set({ messageText })
      .where(
        and(
          eq(botMessages.projectId, projectId),
          sql`${botMessages.messageData}->>'broadcastId' = ${String(broadcastId)}`
        )
      );

    res.json({ ok: true, edited, failed });
  } catch (error) {
    console.error("[editBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
