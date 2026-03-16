/**
 * @fileoverview Обработчик проверки статуса участника
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на проверку статуса участника группы.
 *
 * @module botIntegration/groups/members/checkMemberHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";
import { getFriendlyStatus } from "../../handlers/telegramGroups/utils/getFriendlyStatus";
import { saveMemberToDb } from "../../handlers/telegramGroups/utils/saveMemberToDb";

/**
 * Обрабатывает запрос на проверку статуса участника группы
 *
 * @function checkMemberHandler
 * @param {Request} req - Объект запроса Express
 * @param {Response} res - Объект ответа Express
 * @returns {Promise<void>}
 */
export async function checkMemberHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, userId } = req.params;

        if (!groupId || groupId === "null" || !userId) {
            res.status(400).json({ message: "Требуется ID группы и ID пользователя" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMember`;
        const response = await fetchWithProxy(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: groupId, user_id: parseInt(userId) })
        });

        const result = await response.json();

        console.log("Ответ Telegram API при проверке участника:", {
            ok: response.ok,
            status: response.status,
            result: result,
            groupId: groupId,
            userId: userId
        });

        if (!response.ok) {
            console.error("Не удалось проверить статус участника через Telegram API:", result);
            if (result.description && result.description.includes("user not found")) {
                res.status(400).json({
                    message: "Пользователь не найден",
                    error: "Пользователь не найден. Убедитесь, что вы указали правильный @username или числовой ID."
                });
                return;
            }
            res.status(400).json({
                message: "Не удалось проверить статус участника",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        const member = result.result;

        await saveMemberToDb(projectId, groupId, userId, member);

        const responseData = {
            member: {
                ...member,
                friendlyStatus: getFriendlyStatus(member.status)
            }
        };

        console.log("Отправка ответа:", responseData);
        res.json(responseData);
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка проверки статуса участника:", errorInfo);
        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
