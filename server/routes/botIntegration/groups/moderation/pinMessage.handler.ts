/**
 * @fileoverview Обработчик закрепления сообщения в группе
 *
 * @module botIntegration/groups/moderation/pinMessage
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Закрепляет сообщение в группе через Telegram Bot API
 *
 * @function pinMessageHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @route POST /api/projects/:projectId/bot/pin-message
 */
export async function pinMessageHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, messageId, disableNotification } = req.body;

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

        const result = await callPinChatMessage(
            defaultToken.token,
            groupId,
            messageId,
            disableNotification
        );

        if (!result.success) {
            res.status(400).json({
                message: "Не удалось закрепить сообщение",
                error: result.error || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ 
            success: true, 
            message: "Сообщение успешно закреплено" 
        });
    } catch (error) {
        console.error("Не удалось закрепить сообщение:", error);
        res.status(500).json({ 
            message: "Не удалось закрепить сообщение" 
        });
    }
}

/**
 * Вызывает Telegram API для закрепления сообщения
 *
 * @function callPinChatMessage
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @param {number} messageId - ID сообщения
 * @param {boolean} disableNotification - Отключить уведомление
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
async function callPinChatMessage(
    token: string,
    groupId: string,
    messageId: number,
    disableNotification: boolean
): Promise<{ success: boolean; error?: string }> {
    const telegramApiUrl = `https://api.telegram.org/bot${token}/pinChatMessage`;
    
    const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: groupId,
            message_id: messageId,
            disable_notification: disableNotification || false
        })
    });

    const result = await response.json();

    if (!response.ok) {
        return { success: false, error: result.description || "Неизвестная ошибка" };
    }

    return { success: true };
}
