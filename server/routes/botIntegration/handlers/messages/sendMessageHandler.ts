/**
 * @fileoverview Хендлер отправки сообщения пользователю
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на отправку сообщения пользователю через Telegram Bot API.
 *
 * @module botIntegration/handlers/messages/sendMessageHandler
 */

import type { Request, Response } from "express";
import { sendMessageSchema } from "@shared/schema";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на отправку сообщения
 *
 * @function sendMessageHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function sendMessageHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const userId = req.params.userId;

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const validationResult = sendMessageSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Неверное тело запроса",
                errors: validationResult.error.errors
            });
            return;
        }

        const { messageText } = validationResult.data;

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/sendMessage`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: userId,
                text: messageText.trim(),
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

        await storage.createBotMessage({
            projectId,
            userId,
            messageType: "bot",
            messageText: messageText.trim(),
            messageData: { sentFromAdmin: true }
        });

        res.json({ message: "Сообщение успешно отправлено", result });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка отправки сообщения:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
