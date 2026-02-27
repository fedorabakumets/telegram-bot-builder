/**
 * @fileoverview Хендлер разбана участника группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на разбан участника группы через Telegram Bot API.
 *
 * @module botIntegration/handlers/telegramGroups/unbanMemberHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на разбан участника
 *
 * @function unbanMemberHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function unbanMemberHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, userId } = req.body;

        if (!groupId || !userId) {
            res.status(400).json({ message: "Требуется ID группы и ID пользователя" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/unbanChatMember`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: groupId,
                user_id: userId,
                only_if_banned: true
            })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось разбанить участника",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ success: true, message: "Участник разбанен" });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка разбана участника:", errorInfo);
        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
