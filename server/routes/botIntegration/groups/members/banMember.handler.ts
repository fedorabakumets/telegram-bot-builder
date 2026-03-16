/**
 * @fileoverview Хендлер бана участника группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на бан участника группы через Telegram Bot API.
 *
 * @module botIntegration/groups/members/banMember
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на бан участника
 *
 * @function banMemberHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function banMemberHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, userId, untilDate } = req.body;

        if (!groupId || !userId) {
            res.status(400).json({ message: "Требуется ID группы и ID пользователя" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/banChatMember`;
        const response = await fetchWithProxy(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: groupId,
                user_id: userId,
                until_date: untilDate || undefined
            })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось забанить участника",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ success: true, message: "Участник забанен" });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка бана участника:", errorInfo);
        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
