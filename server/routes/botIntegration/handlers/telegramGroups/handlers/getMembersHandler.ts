/**
 * @fileoverview Хендлер получения участников
 *
 * Этот модуль предоставляет функцию для получения
 * участников группы и формирования ответа.
 *
 * @module botIntegration/handlers/telegramGroups/handlers/getMembersHandler
 */

import type { Response } from "express";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../../utils/telegram-error-handler";
import { fetchGroupMembers, createMembersResponse } from "../utils/fetchGroupMembers";

/**
 * Получает участников группы
 *
 * @function getMembersHandler
 * @param {Response} res - Объект ответа
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @param {number | string} memberCount - Количество участников
 * @returns {Promise<void>}
 */
export async function getMembersHandler(
    res: Response,
    token: string,
    groupId: string,
    memberCount: number | string
): Promise<void> {
    try {
        const adminsResult = await fetchGroupMembers(token, groupId);

        if (!adminsResult.ok) {
            res.status(400).json({
                message: "Ошибка при получении участников",
                error: adminsResult.description || "Неизвестная ошибка"
            });
            return;
        }

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
}
