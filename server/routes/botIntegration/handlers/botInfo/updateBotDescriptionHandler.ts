/**
 * @fileoverview Хендлер обновления описания бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на обновление описания бота через Telegram Bot API.
 *
 * @module botIntegration/handlers/botInfo/updateBotDescriptionHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на обновление описания бота
 *
 * @function updateBotDescriptionHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function updateBotDescriptionHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const { description, language_code = 'ru' } = req.body;

        console.log('🔧 Обновление описания бота:', { projectId, description, language_code });

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            console.error('❌ Токен бота не найден для проекта', projectId);
            res.status(400).json({ message: "Токен бота не найден. Добавьте токен." });
            return;
        }

        console.log('✅ Токен найден, отправляем запрос к Telegram API...');

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setMyDescription`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description, language_code })
        });

        const result = await response.json();

        console.log('📡 Ответ от Telegram API setMyDescription:', { status: response.status, result });

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось обновить описание бота",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ message: "Описание бота успешно обновлено" });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка обновления описания бота:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
