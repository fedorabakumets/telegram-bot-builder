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
import type { SendMediaFile } from "./extract-media";

/**
 * Определяет тип медиа по расширению URL
 * @param url - URL файла
 * @returns Тип медиа для Telegram API: photo, video, audio или document
 */
function resolveMediaType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'photo';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
  return 'document';
}

/**
 * Преобразует массив URL медиафайлов в формат SendMediaFile.
 * Поддерживает JSON file_id записи вида {"__type":"file_id","mediaType":"photo","fileIdsByToken":{"42":"AgAC..."}}.
 * @param mediaUrls - Массив URL медиафайлов
 * @param tokenId - ID токена для выбора нужного file_id из маппинга
 * @returns Массив SendMediaFile для sendTelegramMessage
 */
function buildMediaFiles(mediaUrls: string[], tokenId: number): SendMediaFile[] {
  const result: SendMediaFile[] = [];

  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i];

    // Формат JSON file_id
    if (url.startsWith('{"__type":"file_id"')) {
      try {
        const parsed = JSON.parse(url) as {
          __type: string;
          mediaType?: string;
          fileIdsByToken?: Record<string, string>;
        };
        const fileIdsByToken = parsed.fileIdsByToken ?? {};
        // Сначала ищем file_id для текущего токена, затем берём первый доступный
        const fileId =
          fileIdsByToken[String(tokenId)] ?? Object.values(fileIdsByToken)[0];
        if (fileId) {
          result.push({ id: i, url: fileId, type: parsed.mediaType ?? 'photo' });
        }
      } catch {
        console.warn(`[sendMessageHandler] Не удалось распарсить file_id: ${url.slice(0, 80)}`);
      }
      continue;
    }

    result.push({ id: i, url, type: resolveMediaType(url) });
  }

  return result;
}

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

    const mediaFiles = buildMediaFiles(mediaUrls, effectiveTokenId);

    const result = await sendTelegramMessage(
      selectedToken.token,
      userId,
      textWithVariables,
      mediaFiles,
      [],
      true
    );

    const savedMessage = await storage.createBotMessage({
      projectId,
      tokenId: effectiveTokenId,
      userId,
      messageType: "bot",
      messageText: textWithVariables.trim(),
      messageData: { sentFromAdmin: true },
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
        messageData: { sentFromAdmin: true },
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
