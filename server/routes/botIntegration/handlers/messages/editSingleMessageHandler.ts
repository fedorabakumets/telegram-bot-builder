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
import { extractButtonsFromNode } from "./extract-buttons";
import { buildInlineKeyboard } from "./send-telegram-message";

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
 * @param replyMarkup - Встроенная клавиатура (inline_keyboard); пустой массив убирает кнопки
 * @returns Успех операции и возможная ошибка
 */
async function callTelegramEditMessage(
  token: string,
  chatId: string,
  telegramMessageId: number,
  messageText: string,
  isMedia: boolean,
  replyMarkup: { inline_keyboard: any[][] }
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
      reply_markup: replyMarkup,
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
 * 2. Находит запись в БД, проверяет принадлежность проекту и тип 'bot'
 * 3. Если нет telegramMessageId — возвращает 400 (редактирование невозможно)
 * 4. Вызывает Telegram API — при ошибке возвращает 400, БД не трогает
 * 5. Только при успехе Telegram — обновляет messageText в БД
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
    const { messageText, buttons = [], buttonsPerRow = 0 } = req.body as {
      messageText?: string;
      buttons?: unknown[];
      buttonsPerRow?: number;
    };

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

    // Без telegram_message_id редактирование невозможно — нечего синхронизировать
    if (!message.telegramMessageId) {
      res.status(400).json({ message: "Сообщение не имеет Telegram ID — редактирование недоступно" });
      return;
    }

    // Редактируем в Telegram — только при успехе обновляем БД
    const tokenId = getRequestTokenId(req);
    const { selectedToken } = await resolveEffectiveProjectToken(projectId, tokenId);

    if (!selectedToken?.token) {
      res.status(400).json({ message: "Токен бота не найден для этого проекта" });
      return;
    }

    const isMedia = hasMediaAttachment(message.messageData);

    // Пересобираем inline-клавиатуру из переданных кнопок. Пустой массив кнопок
    // даёт { inline_keyboard: [] } — это осознанно убирает клавиатуру у сообщения.
    const replyMarkup = buttons.length > 0
      ? buildInlineKeyboard(extractButtonsFromNode({ buttons }), buttonsPerRow)
      : { inline_keyboard: [] as any[][] };

    const telegramResult = await callTelegramEditMessage(
      selectedToken.token,
      message.userId,
      message.telegramMessageId,
      messageText,
      isMedia,
      replyMarkup
    );

    if (!telegramResult.success) {
      console.warn(`Не удалось отредактировать сообщение ${messageId} в Telegram: ${telegramResult.error}`);
      res.status(400).json({
        message: `Telegram не принял изменение: ${telegramResult.error ?? "неизвестная ошибка"}`,
      });
      return;
    }

    // Telegram подтвердил — обновляем БД (текст и данные сообщения с новыми кнопками)
    const updatedMessageData = {
      ...(message.messageData && typeof message.messageData === "object"
        ? (message.messageData as Record<string, unknown>)
        : {}),
      buttons,
      buttonsPerRow,
    };

    await db
      .update(botMessages)
      .set({ messageText, messageData: updatedMessageData })
      .where(eq(botMessages.id, messageId));

    // Рассылаем WS-событие всем подключённым клиентам проекта
    await broadcastProjectEvent(projectId, {
      type: "message-edited",
      projectId,
      tokenId: message.tokenId,
      data: { messageId, userId: message.userId, messageText, buttons, buttonsPerRow },
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, editedInTelegram: true });
  } catch (error) {
    console.error("Ошибка редактирования сообщения:", error);
    res.status(500).json({ message: "Не удалось отредактировать сообщение" });
  }
}
