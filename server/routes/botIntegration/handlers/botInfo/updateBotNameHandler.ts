/**
 * @fileoverview Хендлер обновления имени бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на обновление имени бота через Telegram Bot API.
 *
 * @module botIntegration/handlers/botInfo/updateBotNameHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на обновление имени бота
 *
 * @function updateBotNameHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function updateBotNameHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const { name, language_code = 'ru' } = req.body;

        console.log('🔧 Обновление имени бота:', { projectId, name, language_code });

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            console.error('❌ Токен бота не найден для проекта', projectId);
            res.status(400).json({ message: "Токен бота не найден. Добавьте токен." });
            return;
        }

        console.log('✅ Токен найден, отправляем запрос к Telegram API...');

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/setMyName`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, language_code })
        });

        const result = await response.json();

        console.log('📡 Ответ от Telegram API setMyName:', { status: response.status, result });

        if (!response.ok) {
            console.error('❌ Ошибка от Telegram API:', result);
            res.status(400).json({
                message: "Не удалось обновить имя бота",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        console.log('✅ Имя бота успешно обновлено через Telegram API');
        res.json({ message: "Имя бота успешно обновлено" });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка обновления имени бота:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
