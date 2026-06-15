/**
 * @fileoverview Хендлер отправки сообщения в группу
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на отправку сообщения в группу через Telegram Bot API.
 * Поддерживает текст и медиафайлы (URL, локальные файлы и file_id).
 *
 * @module botIntegration/handlers/telegramGroups/sendGroupMessageHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
import { sendTelegramMessage } from "../messages/send-telegram-message";
import { extractButtonsFromNode } from "../messages/extract-buttons";
import { buildMediaFiles } from "../messages/build-media-files";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";
import {
    getRequestTokenId,
    resolveEffectiveProjectToken,
} from "../../../utils/resolve-request-token";

/**
 * Обрабатывает запрос на отправку сообщения в группу
 *
 * @function sendGroupMessageHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function sendGroupMessageHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, message } = req.body;
        /** Массив URL медиафайлов из тела запроса (опционально) */
        const mediaUrls: string[] = Array.isArray(req.body.mediaUrls) ? req.body.mediaUrls : [];
        /** Сырые инлайн-кнопки из тела запроса (формат Button фронтенда) */
        const rawButtons = Array.isArray(req.body.buttons) ? req.body.buttons : [];
        /** Инлайн-кнопки в формате Telegram API */
        const buttons = extractButtonsFromNode({ buttons: rawButtons });

        // Требуется ID группы и хотя бы текст, медиа или кнопки
        if (!groupId || (!message && mediaUrls.length === 0 && buttons.length === 0)) {
            res.status(400).json({ message: "Требуется ID группы и сообщение" });
            return;
        }

        const requestedTokenId = getRequestTokenId(req);
        const { selectedToken, effectiveTokenId } = await resolveEffectiveProjectToken(projectId, requestedTokenId);
        if (!selectedToken || effectiveTokenId === null) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        // Строим медиафайлы из mediaUrls (URL, локальные файлы, file_id)
        const mediaFiles = buildMediaFiles(mediaUrls, effectiveTokenId);

        // Отправляем через общий sendTelegramMessage (текст + медиа)
        const result = await sendTelegramMessage(
            selectedToken.token,
            groupId,
            message ?? "",
            mediaFiles,
            buttons,
            true
        );

        /** ID отправленного сообщения в Telegram */
        const telegramMessageId = result.result?.message_id ?? null;

        /** Данные сообщения для сохранения — с медиа для корректного отображения в диалоге */
        const messageData: Record<string, unknown> = { sentFromAdmin: true };
        if (mediaFiles.length > 0) {
            messageData.broadcastMediaUrl = mediaFiles[0].url;
            messageData.broadcastMediaType = mediaFiles[0].type;
        }
        // Сохраняем кнопки для отображения в истории диалога
        if (rawButtons.length > 0) {
            messageData.buttons = rawButtons;
        }

        // Записываем сообщение в БД для отображения в диалоге группы
        await storage.createBotMessage({
            projectId,
            tokenId: effectiveTokenId,
            userId: groupId,
            chatId: groupId,
            messageType: "bot",
            messageText: message ?? "",
            messageData,
            telegramMessageId,
        });

        // Публикуем WS-событие чтобы диалог группы обновился в реальном времени
        await broadcastProjectEvent(projectId, {
            type: "new-message",
            projectId,
            tokenId: effectiveTokenId,
            data: {
                id: 0,
                userId: groupId,
                chatId: groupId,
                messageType: "bot",
                messageText: message ?? "",
                messageData,
                nodeId: null,
                createdAt: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
        });

        res.json({
            message: "Сообщение успешно отправлено",
            messageId: telegramMessageId
        });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка отправки сообщения в группу:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
