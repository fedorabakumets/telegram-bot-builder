/**
 * @fileoverview Хендлер отправки сообщения пользователю с записью в сегмент bot_messages по effective tokenId
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

/**
 * Обрабатывает запрос на отправку сообщения пользователю
 * @param req - Объект запроса
 * @param res - Объект ответа
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
    const user = await storage.getUserBotDataByProjectAndUser(projectId, userId, effectiveTokenId);
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

    const response = await fetch(`https://api.telegram.org/bot${selectedToken.token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: userId,
        text: textWithVariables.trim(),
        parse_mode: "HTML",
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      res.status(400).json({
        message: "Не удалось отправить сообщение",
        error: result.description || "Неизвестная ошибка",
      });
      return;
    }

    await storage.createBotMessage({
      projectId,
      tokenId: effectiveTokenId,
      userId,
      messageType: "bot",
      messageText: textWithVariables.trim(),
      messageData: { sentFromAdmin: true },
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
