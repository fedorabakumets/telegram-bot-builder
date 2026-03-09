/**
 * @fileoverview Хендлер проверки статуса администратора бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на проверку статуса бота в группе через Telegram Bot API.
 *
 * @module botIntegration/handlers/telegramGroups/getBotAdminStatusHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на проверку статуса администратора
 *
 * @function getBotAdminStatusHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getBotAdminStatusHandler(req: Request, res: Response): Promise<void> {
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

        const botInfoResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getMe`);
        const botInfo = await botInfoResponse.json();

        if (!botInfoResponse.ok) {
            res.status(400).json({ message: "Не удалось получить информацию о боте" });
            return;
        }

        const botId = botInfo.result.id;

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMember`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: groupId,
                user_id: botId
            })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось получить статус администратора",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        const isAdmin = ['administrator', 'creator'].includes(result.result.status);

        res.json({
            isAdmin,
            status: result.result.status,
            permissions: result.result
        });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка получения статуса администратора:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
