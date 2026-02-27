/**
 * @fileoverview Хендлер получения информации о боте
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение информации о боте через Telegram Bot API.
 *
 * @module botIntegration/handlers/botInfo/getBotInfoHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на получение информации о боте
 *
 * @function getBotInfoHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getBotInfoHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);

        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден. Добавьте токен." });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getMe?_t=${Date.now()}`;
        const response = await fetch(telegramApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось получить информацию о боте",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        const botInfo = result.result;

        console.log('Telegram API response:', JSON.stringify({
            first_name: botInfo.first_name,
            username: botInfo.username,
            description: botInfo.description,
            short_description: botInfo.short_description
        }, null, 2));

        let photoUrl = null;
        if (botInfo.photo && botInfo.photo.big_file_id) {
            try {
                const fileResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getFile`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        file_id: botInfo.photo.big_file_id
                    })
                });

                const fileResult = await fileResponse.json();

                if (fileResponse.ok && fileResult.result && fileResult.result.file_path) {
                    photoUrl = `https://api.telegram.org/file/bot${defaultToken.token}/${fileResult.result.file_path}`;
                }
            } catch (photoError) {
                console.warn("Не удалось получить URL фото бота:", photoError);
            }
        }

        const responseData = {
            ...botInfo,
            photoUrl: photoUrl
        };

        res.json(responseData);
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка получения информации о боте:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
