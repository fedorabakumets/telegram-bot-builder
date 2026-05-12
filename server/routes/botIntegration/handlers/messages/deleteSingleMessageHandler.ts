/**
 * @fileoverview Хендлер удаления одного сообщения из диалога
 *
 * Удаляет конкретное сообщение по внутреннему ID:
 * сначала из Telegram (если есть telegram_message_id), затем из БД.
 *
 * @module botIntegration/handlers/messages/deleteSingleMessageHandler
 */

import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../../../database/db";
import { botMessages } from "@shared/schema";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import {
  resolveEffectiveProjectToken,
  getRequestTokenId,
} from "../../../utils/resolve-request-token";

/**
 * Вызывает Telegram Bot API для удаления сообщения из чата
 *
 * @param token - Токен бота
 * @param chatId - ID чата (userId в Telegram)
 * @param telegramMessageId - ID сообщения в Telegram
 * @returns Успех операции и возможная ошибка
 */
async function callTelegramDeleteMessage(
  token: string,
  chatId: string,
  telegramMessageId: number
): Promise<{ success: boolean; error?: string }> {
  const url = `https://api.telegram.org/bot${token}/deleteMessage`;

  const response = await fetchWithProxy(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: telegramMessageId,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, error: result.description ?? "Неизвестная ошибка" };
  }

  return { success: true };
}

/**
 * Обрабатывает запрос на удаление одного сообщения из диалога
 *
 * Алгоритм:
 * 1. Читает messageId из params и находит запись в БД
 * 2. Если есть telegram_message_id — удаляет сообщение через Telegram API
 * 3. Физически удаляет запись из таблицы bot_messages
 *
 * @param req - Объект запроса Express (params: projectId, messageId)
 * @param res - Объект ответа Express
 * @returns Promise<void>
 *
 * @route DELETE /api/projects/:projectId/messages/:messageId
 */
export async function deleteSingleMessageHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId);
    const messageId = parseInt(req.params.messageId);

    if (isNaN(projectId) || isNaN(messageId)) {
      res.status(400).json({ message: "Неверный ID проекта или сообщения" });
      return;
    }

    // Получаем запись сообщения из БД
    const [message] = await db
      .select()
      .from(botMessages)
      .where(eq(botMessages.id, messageId));

    if (!message) {
      res.status(404).json({ message: "Сообщение не найдено" });
      return;
    }

    // Проверяем принадлежность сообщения проекту
    if (message.projectId !== projectId) {
      res.status(403).json({ message: "Сообщение не принадлежит данному проекту" });
      return;
    }

    // Пытаемся удалить из Telegram, если есть telegram_message_id
    let deletedFromTelegram = false;

    if (message.telegramMessageId) {
      const tokenId = getRequestTokenId(req);
      const { selectedToken } = await resolveEffectiveProjectToken(projectId, tokenId);

      if (selectedToken?.token) {
        const result = await callTelegramDeleteMessage(
          selectedToken.token,
          message.userId,
          message.telegramMessageId
        );
        deletedFromTelegram = result.success;

        if (!result.success) {
          console.warn(
            `Не удалось удалить сообщение ${messageId} из Telegram: ${result.error}`
          );
        }
      }
    }

    // Физически удаляем запись из БД
    await db.delete(botMessages).where(eq(botMessages.id, messageId));

    res.json({ success: true, deletedFromTelegram });
  } catch (error) {
    console.error("Ошибка удаления сообщения:", error);
    res.status(500).json({ message: "Не удалось удалить сообщение" });
  }
}
