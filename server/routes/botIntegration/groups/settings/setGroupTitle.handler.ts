/**
 * @fileoverview Обработчик установки названия группы
 *
 * @module botIntegration/groups/settings/setGroupTitle
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Устанавливает название группы через Telegram Bot API
 *
 * @function setGroupTitleHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @route POST /api/projects/:projectId/bot/set-group-title
 */
export async function setGroupTitleHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, title } = req.body;

        if (!groupId || !title) {
            res.status(400).json({ 
                message: "Требуются ID группы и название" 
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

        const result = await callSetChatTitle(defaultToken.token, groupId, title);

        if (!result.success) {
            res.status(400).json({
                message: "Не удалось установить название группы",
                error: result.error || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ 
            success: true, 
            message: "Название группы успешно обновлено" 
        });
    } catch (error) {
        console.error("Не удалось установить название группы:", error);
        res.status(500).json({ 
            message: "Не удалось установить название группы" 
        });
    }
}

/**
 * Вызывает Telegram API для установки названия группы
 *
 * @function callSetChatTitle
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @param {string} title - Новое название
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
async function callSetChatTitle(
    token: string,
    groupId: string,
    title: string
): Promise<{ success: boolean; error?: string }> {
    const telegramApiUrl = `https://api.telegram.org/bot${token}/setChatTitle`;
    
    const response = await fetchWithProxy(telegramApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: groupId,
            title: title
        })
    });

    const result = await response.json();

    if (!response.ok) {
        return { success: false, error: result.description || "Неизвестная ошибка" };
    }

    return { success: true };
}
