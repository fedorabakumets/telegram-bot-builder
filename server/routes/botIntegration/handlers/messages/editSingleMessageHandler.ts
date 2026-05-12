/**
 * @fileoverview Хендлер редактирования одного сообщения бота в диалоге
 *
 * Редактирует текст сообщения: сначала в Telegram (если есть telegramMessageId),
 * затем обновляет запись в БД и рассылает WS-событие.
 *
 * @module botIntegration/handlers/messages/editSingleMessageHandler
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
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";

/**
 * Проверяет наличие медиа-вложения в данных сообщения
 * @param messageData - Данные сообщения из БД
 * @returns true если сообщение содержит медиа с file_id
 */
function hasMediaAttachment(messageData: unknown): boolean {
  if (!messageData || typeof messageData !== "object") return false;
  const data = messageData as Record<string, unknown>;
  return ["photo", "video", "audio", "voice", "document", "sticker"].some(
    (type) => data[type] && typeof (data[type] as Record<string, unknown>)?.file_id === "string"
  );
}

/**
 * Вызывает Telegram API для редактирования текста или подписи к медиа
 * @param token - Токен бота
 * @param chatId - ID чата (userId в Telegram)
 * @param telegramMessageId - ID сообщения в Telegram
 * @param messageText - Новый текст сообщения
 * @param isMedia - Редактировать подпись (caption) или текст
 * @returns Успех операции и возможная ошибка
 */
async function callTelegramEditMessage(
  token: string,
  chatId: string,
  telegramMessageId: number,
  messageText: string,
  isMedia: boolean
): Promise<{ success: boolean; error?: string }> {
  const method = isMedia ? "editMessageCaption" : "editMessageText";
  const textField = isMedia ? "caption" : "text";
  const url = `https://api.telegram.org/bot${token}/${method}`;

  const response = await fetchWithProxy(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: telegramMessageId,
      [textField]: messageText,
      parse_mode: "HTML",
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, error: (result as { description?: string }).description ?? "Неизвестная ошибка" };
  }

  return { success: true };
}

/**
 * Обрабатывает запрос на редактирование одного сообщения бота
 *
 * Алгоритм:
 * 1. Читает messageId из params, messageText из body
 * 2. Находит запись в БД, проверяет принадлежность проекту
 * 3. Проверяет что сообщение от бота (messageType === 'bot')
 * 4. Если есть telegramMessageId — редактирует через Telegram API
 * 5. Обновляет messageText в БД
 * 6. Рассылает WS-событие message-edited
 *
 * @param req - Объект запроса Express (params: projectId, messageId; body: messageText)
 * @param res - Объект ответа Express
 * @returns Promise<void>
 *
 * @route PATCH /api/projects/:projectId/messages/:messageId
 */
export async function editSingleMessageHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId);
    const messageId = parseInt(req.params.messageId);
    const { messageText } = req.body as { messageText?: string };

    if (isNaN(projectId) || isNaN(messageId)) {
      res.status(400).json({ message: "Неверный ID проекта или сообщения" });
      return;
    }

    if (!messageText || typeof messageText !== "string" || messageText.trim() === "") {
      res.status(400).json({ message: "Текст сообщения не может быть пустым" });
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

    // Редактировать можно только сообщения бота
    if (message.messageType !== "bot") {
      res.status(400).json({ message: "Нельзя редактировать сообщения пользователя" });
      return;
    }

    // Пытаемся отредактировать в Telegram, если есть telegramMessageId
    let editedInTelegram = false;

    if (message.telegramMessageId) {
      const tokenId = getRequestTokenId(req);
      const { selectedToken } = await resolveEffectiveProjectToken(projectId, tokenId);

      if (selectedToken?.token) {
        const isMedia = hasMediaAttachment(message.messageData);
        const result = await callTelegramEditMessage(
          selectedToken.token,
          message.userId,
          message.telegramMessageId,
          messageText,
          isMedia
        );
        editedInTelegram = result.success;

        if (!result.success) {
          console.warn(`Не удалось отредактировать сообщение ${messageId} в Telegram: ${result.error}`);
        }
      }
    }

    // Обновляем текст в БД
    await db
      .update(botMessages)
      .set({ messageText })
      .where(eq(botMessages.id, messageId));

    // Рассылаем WS-событие всем подключённым клиентам проекта
    await broadcastProjectEvent(projectId, {
      type: "message-edited",
      projectId,
      tokenId: message.tokenId,
      data: { messageId, userId: message.userId, messageText },
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, editedInTelegram });
  } catch (error) {
    console.error("Ошибка редактирования сообщения:", error);
    res.status(500).json({ message: "Не удалось отредактировать сообщение" });
  }
}
