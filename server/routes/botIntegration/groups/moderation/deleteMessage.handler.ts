/**
 * @fileoverview Обработчик удаления сообщения в группе
 *
 * @module botIntegration/groups/moderation/deleteMessage
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Удаляет сообщение в группе через Telegram Bot API
 *
 * @function deleteMessageHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @route POST /api/projects/:projectId/bot/delete-message
 */
export async function deleteMessageHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, messageId } = req.body;

        if (!groupId || !messageId) {
            res.status(400).json({ 
                message: "Требуются ID группы и ID сообщения" 
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

        const result = await callDeleteMessage(
            defaultToken.token,
            groupId,
            messageId
        );

        if (!result.success) {
            res.status(400).json({
                message: "Не удалось удалить сообщение",
                error: result.error || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ 
            success: true, 
            message: "Сообщение успешно удалено" 
        });
    } catch (error) {
        console.error("Не удалось удалить сообщение:", error);
        res.status(500).json({ 
            message: "Не удалось удалить сообщение" 
        });
    }
}

/**
 * Вызывает Telegram API для удаления сообщения
 *
 * @function callDeleteMessage
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @param {number} messageId - ID сообщения
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
async function callDeleteMessage(
    token: string,
    groupId: string,
    messageId: number
): Promise<{ success: boolean; error?: string }> {
    const telegramApiUrl = `https://api.telegram.org/bot${token}/deleteMessage`;
    
    const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: groupId,
            message_id: messageId
        })
    });

    const result = await response.json();

    if (!response.ok) {
        return { success: false, error: result.description || "Неизвестная ошибка" };
    }

    return { success: true };
}
