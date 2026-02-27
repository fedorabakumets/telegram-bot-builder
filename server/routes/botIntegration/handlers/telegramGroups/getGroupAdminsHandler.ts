/**
 * @fileoverview Хендлер получения списка администраторов группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка администраторов группы через Telegram Bot API.
 *
 * @module botIntegration/handlers/telegramGroups/getGroupAdminsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";
import { getBotAdminRights } from "./utils/getBotAdminRights";

/**
 * Обрабатывает запрос на получение списка администраторов
 *
 * @function getGroupAdminsHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getGroupAdminsHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId } = req.params;

        if (!groupId || groupId === "null") {
            res.status(400).json({ message: "Требуется ID группы" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatAdministrators`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: groupId })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось получить список администраторов",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        const botUser = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getMe`);
        const botInfo = await botUser.json();

        const botAdminRights = botUser.ok && result.result
            ? getBotAdminRights(result.result, botInfo.result.id)
            : null;

        res.json({
            administrators: result.result,
            botAdminRights: botAdminRights
        });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка получения списка администраторов:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
