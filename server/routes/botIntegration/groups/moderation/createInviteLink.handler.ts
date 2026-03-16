/**
 * @fileoverview Обработчик создания ссылки-приглашения для группы
 *
 * @module botIntegration/groups/moderation/createInviteLink
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Создаёт новую ссылку-приглашение для группы
 *
 * @function createInviteLinkHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @route POST /api/projects/:projectId/bot/create-invite-link
 */
export async function createInviteLinkHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, name, expireDate, memberLimit, createsJoinRequest } = req.body;

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

        const result = await callCreateChatInviteLink(
            defaultToken.token,
            groupId,
            { name, expireDate, memberLimit, createsJoinRequest }
        );

        if (!result.success) {
            res.status(400).json({
                message: "Не удалось создать ссылку-приглашение",
                error: result.error || "Неизвестная ошибка"
            });
            return;
        }

        res.json({
            success: true,
            inviteLink: result.data,
            message: "Ссылка-приглашение успешно создана"
        });
    } catch (error) {
        console.error("Не удалось создать ссылку-приглашение:", error);
        res.status(500).json({ 
            message: "Не удалось создать ссылку-приглашение" 
        });
    }
}

/**
 * Вызывает Telegram API для создания ссылки-приглашения
 *
 * @function callCreateChatInviteLink
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @param {Object} options - Опции ссылки
 * @param {string} [options.name] - Название ссылки
 * @param {number} [options.expireDate] - Дата истечения
 * @param {number} [options.memberLimit] - Лимит участников
 * @param {boolean} [options.createsJoinRequest] - Создавать запросы на вступление
 * @returns {Promise<{ success: boolean; error?: string; data?: any }>}
 */
async function callCreateChatInviteLink(
    token: string,
    groupId: string,
    options: {
        name?: string;
        expireDate?: number;
        memberLimit?: number;
        createsJoinRequest?: boolean;
    }
): Promise<{ success: boolean; error?: string; data?: any }> {
    const telegramApiUrl = `https://api.telegram.org/bot${token}/createChatInviteLink`;

    const response = await fetchWithProxy(telegramApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: groupId,
            name: options.name || undefined,
            expire_date: options.expireDate || undefined,
            member_limit: options.memberLimit || undefined,
            creates_join_request: options.createsJoinRequest || false
        })
    });

    const result = await response.json();

    if (!response.ok) {
        return { success: false, error: result.description || "Неизвестная ошибка" };
    }

    return { success: true, data: result.result };
}
