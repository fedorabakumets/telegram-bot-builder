/**
 * @fileoverview Хендлер отправки сообщения в группу
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на отправку сообщения в группу через Telegram Bot API.
 *
 * @module botIntegration/handlers/telegramGroups/sendGroupMessageHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

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

        if (!groupId || !message) {
            res.status(400).json({ message: "Требуется ID группы и сообщение" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден. Добавьте токен." });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/sendMessage`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: groupId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось отправить сообщение",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        res.json({
            message: "Сообщение успешно отправлено",
            messageId: result.result.message_id
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
