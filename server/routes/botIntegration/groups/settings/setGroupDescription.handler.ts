/**
 * @fileoverview Обработчик установки описания группы
 *
 * @module botIntegration/groups/settings/setGroupDescription
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Устанавливает описание группы через Telegram Bot API
 *
 * @function setGroupDescriptionHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @route POST /api/projects/:projectId/bot/set-group-description
 */
export async function setGroupDescriptionHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, description } = req.body;

        if (!groupId || !description) {
            res.status(400).json({ 
                message: "Требуются ID группы и описание" 
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

        const result = await callSetChatDescription(
            defaultToken.token, 
            groupId, 
            description
        );

        if (!result.success) {
            res.status(400).json({
                message: "Не удалось установить описание группы",
                error: result.error || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ 
            success: true, 
            message: "Описание группы успешно обновлено" 
        });
    } catch (error) {
        console.error("Не удалось установить описание группы:", error);
        res.status(500).json({ 
            message: "Не удалось установить описание группы" 
        });
    }
}

/**
 * Вызывает Telegram API для установки описания группы
 *
 * @function callSetChatDescription
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @param {string} description - Новое описание
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
async function callSetChatDescription(
    token: string,
    groupId: string,
    description: string
): Promise<{ success: boolean; error?: string }> {
    const telegramApiUrl = `https://api.telegram.org/bot${token}/setChatDescription`;
    
    const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: groupId,
            description: description
        })
    });

    const result = await response.json();

    if (!response.ok) {
        return { success: false, error: result.description || "Неизвестная ошибка" };
    }

    return { success: true };
}
