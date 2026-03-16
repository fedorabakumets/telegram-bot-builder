/**
 * @fileoverview Хендлер получения информации о группе
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение информации о группе через Telegram Bot API.
 *
 * @module botIntegration/handlers/telegramGroups/getGroupInfoHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на получение информации о группе
 *
 * @function getGroupInfoHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getGroupInfoHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId } = req.params;

        if (!groupId || groupId === 'null' || groupId === 'undefined') {
            res.status(400).json({
                message: "Не указан ID группы",
                error: "Для приватных групп нужно указать chat_id. Отправьте любое сообщение в группу, затем переслайте его в @userinfobot чтобы получить chat_id группы."
            });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден. Добавьте токен." });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChat`;
        const response = await fetchWithProxy(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chat_id: groupId })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось получить информацию о группе",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        const chatInfo = result.result;

        let avatarUrl = null;
        if (chatInfo.photo && chatInfo.photo.big_file_id) {
            try {
                const fileResponse = await fetchWithProxy(`https://api.telegram.org/bot${defaultToken.token}/getFile`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ file_id: chatInfo.photo.big_file_id })
                });

                const fileResult = await fileResponse.json();

                if (fileResponse.ok && fileResult.result && fileResult.result.file_path) {
                    avatarUrl = `https://api.telegram.org/file/bot${defaultToken.token}/${fileResult.result.file_path}`;
                }
            } catch (photoError) {
                console.warn("Не удалось получить URL фото группы:", photoError);
            }
        }

        const responseData = {
            ...chatInfo,
            avatarUrl: avatarUrl
        };

        res.json(responseData);
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка получения информации о группе:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
