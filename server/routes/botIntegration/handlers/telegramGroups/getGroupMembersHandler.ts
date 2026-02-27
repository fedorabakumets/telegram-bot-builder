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
import { isLargeGroup, createLargeGroupResponse } from "./utils/checkGroupSize";
import { fetchGroupMembers, createMembersResponse } from "./utils/fetchGroupMembers";

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

        if (chatInfo.result.members_count && isLargeGroup(chatInfo.result.members_count)) {
            res.status(400).json(createLargeGroupResponse(chatInfo.result.members_count));
            return;
        }

        try {
            const adminsResult = await fetchGroupMembers(defaultToken, groupId);

            if (!adminsResult.ok) {
                res.status(400).json({
                    message: "Ошибка при получении участников",
                    error: adminsResult.description || "Неизвестная ошибка"
                });
                return;
            }

            const memberCount = chatInfo.result.members_count || 'Неизвестно';
            res.json(createMembersResponse(adminsResult.result, memberCount));
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
