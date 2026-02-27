/**
 * @fileoverview Обработчик открепления сообщения в группе
 *
 * @module botIntegration/groups/moderation/unpinMessage
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Открепляет сообщение в группе через Telegram Bot API
 *
 * @function unpinMessageHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @route POST /api/projects/:projectId/bot/unpin-message
 */
export async function unpinMessageHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, messageId } = req.body;

        if (!groupId) {
            res.status(400).json({ 
                message: "Требуется ID группы" 
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

        const result = await callUnpinChatMessage(
            defaultToken.token,
            groupId,
            messageId
        );

        if (!result.success) {
            res.status(400).json({
                message: "Не удалось открепить сообщение",
                error: result.error || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ 
            success: true, 
            message: messageId 
                ? "Сообщение успешно откреплено" 
                : "Все сообщения успешно откреплены"
        });
    } catch (error) {
        console.error("Не удалось открепить сообщение:", error);
        res.status(500).json({ 
            message: "Не удалось открепить сообщение" 
        });
    }
}

/**
 * Вызывает Telegram API для открепления сообщения
 *
 * @function callUnpinChatMessage
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @param {number} [messageId] - ID сообщения (если не указан - открепить все)
 * @returns {Promise<{ success: boolean; error?: string }>}
 */
async function callUnpinChatMessage(
    token: string,
    groupId: string,
    messageId?: number
): Promise<{ success: boolean; error?: string }> {
    const telegramApiUrl = messageId
        ? `https://api.telegram.org/bot${token}/unpinChatMessage`
        : `https://api.telegram.org/bot${token}/unpinAllChatMessages`;
    
    const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: groupId,
            ...(messageId && { message_id: messageId })
        })
    });

    const result = await response.json();

    if (!response.ok) {
        return { success: false, error: result.description || "Неизвестная ошибка" };
    }

    return { success: true };
}
