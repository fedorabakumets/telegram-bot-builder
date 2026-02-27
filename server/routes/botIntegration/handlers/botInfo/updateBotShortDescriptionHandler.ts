/**
 * @fileoverview Хендлер обновления краткого описания бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на обновление краткого описания бота через Telegram Bot API.
 *
 * @module botIntegration/handlers/botInfo/updateBotShortDescriptionHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на обновление краткого описания бота
 *
 * @function updateBotShortDescriptionHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function updateBotShortDescriptionHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const { short_description, language_code = 'ru' } = req.body;

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден. Добавьте токен." });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setMyShortDescription`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ short_description, language_code })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось обновить краткое описание бота",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ message: "Краткое описание бота успешно обновлено" });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка обновления краткого описания бота:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
