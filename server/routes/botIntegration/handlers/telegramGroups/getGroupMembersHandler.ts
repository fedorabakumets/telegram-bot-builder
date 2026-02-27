/**
 * @fileoverview Хендлер получения участников группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка участников группы.
 *
 * @module botIntegration/handlers/telegramGroups/getGroupMembersHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на получение участников группы
 *
 * @function getGroupMembersHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getGroupMembersHandler(req: Request, res: Response): Promise<void> {
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

        const chatInfoResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getChat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: groupId })
        });

        const chatInfo = await chatInfoResponse.json();

        if (!chatInfoResponse.ok) {
            res.status(400).json({
                message: "Не удалось получить информацию о группе",
                error: chatInfo.description || "Неизвестная ошибка"
            });
            return;
        }

        if (chatInfo.result.members_count && chatInfo.result.members_count > 200) {
            res.status(400).json({
                message: "Невозможно получить список участников для больших групп",
                error: "Telegram API позволяет получать полный список участников только для небольших групп (<200 участников). Для больших групп доступны только администраторы.",
                membersCount: chatInfo.result.members_count
            });
            return;
        }

        try {
            const adminsResponse = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getChatAdministrators`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: groupId })
            });

            const adminsResult = await adminsResponse.json();

            if (!adminsResponse.ok) {
                res.status(400).json({
                    message: "Ошибка при получении участников",
                    error: adminsResult.description || "Неизвестная ошибка"
                });
                return;
            }

            const memberCount = chatInfo.result.members_count || 'Неизвестно';

            res.json({
                members: adminsResult.result,
                isPartialList: true,
                totalCount: memberCount,
                message: `Группа содержит ${memberCount} участников. Показаны только администраторы (${adminsResult.result.length}).`,
                explanation: "Telegram API ограничивает доступ к списку участников по соображениям приватности. Доступны только администраторы."
            });
        } catch (error) {
            const errorInfo = analyzeTelegramError(error);
            console.error("Ошибка получения участников:", errorInfo);
            const statusCode = getErrorStatusCode(errorInfo.type);
            res.status(statusCode).json({
                message: errorInfo.userFriendlyMessage,
                errorType: errorInfo.type,
                details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
            });
        }
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка получения участников группы:", errorInfo);
        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
