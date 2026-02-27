/**
 * @fileoverview Обработчик ограничения прав участника группы
 *
 * @module botIntegration/groups/members/restrictMember
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Ограничивает права участника группы
 *
 * @function restrictMemberHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @description
 * Вызывает Telegram Bot API метод restrictChatMember
 * для ограничения прав участника группы.
 *
 * @route POST /api/projects/:projectId/bot/restrict-member
 */
export async function restrictMemberHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, userId, permissions, untilDate } = req.body;

        if (!groupId || !userId) {
            res.status(400).json({ 
                message: "Требуются ID группы и ID пользователя" 
            });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ 
                message: "Токен бота не найден для этого проекта" 
            });
            return;
        }

        const result = await callRestrictApi(
            defaultToken.token,
            groupId,
            userId,
            permissions,
            untilDate
        );

        if (!result.success) {
            console.error("Ошибка Bot API при ограничении участника:", result.error);
            res.status(400).json({
                message: "Не удалось ограничить участника",
                error: result.error?.description || "Неизвестная ошибка",
                details: result.error
            });
            return;
        }

        res.json({ 
            success: true, 
            message: "Участник успешно ограничен" 
        });
    } catch (error) {
        console.error("Не удалось ограничить участника:", error);
        res.status(500).json({ 
            message: "Не удалось ограничить участника" 
        });
    }
}

/**
 * Вызывает Telegram API для ограничения участника
 *
 * @function callRestrictApi
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @param {string} userId - ID пользователя
 * @param {any} permissions - Новые права участника
 * @param {number} [untilDate] - Дата окончания ограничения
 * @returns {Promise<{ success: boolean; error?: any }>}
 */
async function callRestrictApi(
    token: string,
    groupId: string,
    userId: string,
    permissions: any,
    untilDate?: number
): Promise<{ success: boolean; error?: any }> {
    const telegramApiUrl = `https://api.telegram.org/bot${token}/restrictChatMember`;
    
    const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: groupId,
            user_id: userId,
            permissions: permissions,
            until_date: untilDate || undefined
        })
    });

    const result = await response.json();

    if (!response.ok) {
        return { success: false, error: result };
    }

    return { success: true };
}
