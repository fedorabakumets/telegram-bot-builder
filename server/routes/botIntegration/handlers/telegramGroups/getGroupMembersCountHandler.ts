/**
 * @fileoverview Хендлер получения количества участников группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение количества участников группы через Telegram Bot API.
 *
 * @module botIntegration/handlers/telegramGroups/getGroupMembersCountHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на получение количества участников
 *
 * @function getGroupMembersCountHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getGroupMembersCountHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId } = req.params;

        if (!groupId || groupId === 'null' || groupId === 'undefined') {
            res.status(400).json({
                message: "Не указан ID группы",
                error: "Для приватных групп нужно указать chat_id."
            });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден. Добавьте токен." });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMemberCount`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chat_id: groupId })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось получить количество участников",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ count: result.result });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка получения количества участников:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
