/**
 * @fileoverview Хендлер отправки сообщения пользователю с поддержкой медиафайлов
 * @module botIntegration/handlers/messages/sendMessageHandler
 */

import type { Request, Response } from "express";
import { sendMessageSchema } from "@shared/schema";
import { storage } from "../../../../storages/storage";
import {
  analyzeTelegramError,
  getErrorStatusCode,
} from "../../../../utils/telegram-error-handler";
import {
  getRequestTokenId,
  resolveEffectiveProjectToken,
} from "../../../utils/resolve-request-token";
import { replaceVariablesInText } from "./replace-variables";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
import { sendTelegramMessage } from "./send-telegram-message";
import { buildMediaFiles } from "./build-media-files";

/**
 * Обрабатывает запрос на отправку сообщения пользователю.
 * Поддерживает медиафайлы через поле mediaUrls в теле запроса.
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @returns Результат обработки HTTP-запроса
 */
export async function sendMessageHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    const userId = req.params.userId;
    const requestedTokenId = getRequestTokenId(req);

    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    const validationResult = sendMessageSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        message: "Неверное тело запроса",
        errors: validationResult.error.errors,
      });
      return;
    }

    const { selectedToken, effectiveTokenId } = await resolveEffectiveProjectToken(
      projectId,
      requestedTokenId
    );

    if (!selectedToken || effectiveTokenId === null) {
      res.status(400).json({ message: "Токен бота не найден для этого проекта" });
      return;
    }

    const { messageText } = validationResult.data;
    /** Массив URL медиафайлов из тела запроса (опционально) */
    const mediaUrls: string[] = Array.isArray(req.body.mediaUrls) ? req.body.mediaUrls : [];

    const userResult = await (await import("../../../../database/db")).pool.query(
      `SELECT user_id AS "userId", username AS "userName", first_name AS "firstName",
              last_name AS "lastName", user_data AS "userData"
       FROM bot_users WHERE project_id = $1 AND user_id = $2 AND token_id = $3 LIMIT 1`,
      [projectId, userId, effectiveTokenId]
    );
    const user = userResult.rows[0] ?? null;
    const telegramUser = {
      id: Number(userId),
      firstName: user?.firstName || undefined,
      lastName: user?.lastName || undefined,
      username: user?.userName || undefined,
    };
    const userData = (user?.userData as Record<string, unknown>) || {};
    const textWithVariables = await replaceVariablesInText({
      text: messageText,
      userData,
      telegramUser,
      projectId,
    });

    const mediaFiles = buildMediaFiles(mediaUrls, effectiveTokenId);

    const result = await sendTelegramMessage(
      selectedToken.token,
      userId,
      textWithVariables,
      mediaFiles,
      [],
      true
    );

    /** ID отправленного сообщения в Telegram (из result.message_id) */
    const telegramMessageId = result?.result?.message_id ?? null;

    /** Данные о медиа для сохранения в messageData — используются для отображения в диалоге */
    const mediaMessageData: Record<string, unknown> = { sentFromAdmin: true };
    if (mediaFiles.length > 0) {
      mediaMessageData.broadcastMediaUrl = mediaFiles[0].url;
      mediaMessageData.broadcastMediaType = mediaFiles[0].type;
    }

    const savedMessage = await storage.createBotMessage({
      projectId,
      tokenId: effectiveTokenId,
      userId,
      messageType: "bot",
      messageText: textWithVariables.trim(),
      messageData: mediaMessageData,
      telegramMessageId,
    });

    // Публикуем WS-событие чтобы таблица и диалог обновились в реальном времени
    await broadcastProjectEvent(projectId, {
      type: 'new-message',
      projectId,
      tokenId: effectiveTokenId,
      data: {
        id: savedMessage?.id ?? 0,
        userId,
        messageType: 'bot',
        messageText: textWithVariables.trim(),
        messageData: mediaMessageData,
        nodeId: null,
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    res.json({ message: "Сообщение успешно отправлено", result });
  } catch (error) {
    const errorInfo = analyzeTelegramError(error);
    console.error("Ошибка отправки сообщения:", errorInfo);

    res.status(getErrorStatusCode(errorInfo.type)).json({
      message: errorInfo.userFriendlyMessage,
      errorType: errorInfo.type,
      details: process.env.NODE_ENV === "development" ? errorInfo.message : undefined,
    });
  }
}
