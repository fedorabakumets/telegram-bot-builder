/**
 * @fileoverview Хендлер редактирования одного сообщения бота в диалоге
 *
 * Редактирует текст сообщения: сначала в Telegram (если есть telegramMessageId),
 * затем обновляет запись в БД и рассылает WS-событие.
 *
 * @module botIntegration/handlers/messages/editSingleMessageHandler
 */
import { hasMediaAttachment, callTelegramEditMessage } from './edit-single-telegram';

import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../../../database/db";
import { botMessages } from "@shared/schema";
import {
  resolveEffectiveProjectToken,
  getRequestTokenId,
} from "../../../utils/resolve-request-token";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
import { resolveEditKeyboard } from './resolve-edit-keyboard';

/**
 * Обрабатывает запрос на редактирование одного сообщения бота
 *
 * Проверяет проект и бота-отправителя, изменяет Telegram, затем сохраняет историю и событие.
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
    const { messageText, buttons: requestedButtons, buttonsPerRow: requestedPerRow } = req.body as {
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
    /** Идентификатор сообщения Telegram имеет смысл только внутри бота-отправителя. */
    if (tokenId != null && message.tokenId && tokenId !== message.tokenId) {
      res.status(400).json({ message: "Сообщение отправлено другим ботом" });
      return;
    }
    const { selectedToken } = await resolveEffectiveProjectToken(projectId, message.tokenId ?? tokenId);

    if (!selectedToken?.token || message.tokenId && selectedToken.id !== message.tokenId) {
      res.status(400).json({ message: "Токен бота не найден для этого проекта" });
      return;
    }

    const isMedia = hasMediaAttachment(message.messageData);

    /** Изменение текста сохраняет клавиатуру; [] явно снимает кнопки. */
    const { buttons, buttonsPerRow, replyMarkup } = resolveEditKeyboard(message.messageData, requestedButtons, requestedPerRow);

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
      reply_markup: replyMarkup,
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
