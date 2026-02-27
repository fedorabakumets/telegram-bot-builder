/**
 * @fileoverview Хендлер повышения участника
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на повышение участника до администратора через Telegram Bot API.
 *
 * @module botIntegration/handlers/telegramGroups/promoteMemberHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на повышение участника
 *
 * @function promoteMemberHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function promoteMemberHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const {
            groupId, userId,
            can_manage_chat, can_change_info, can_delete_messages,
            can_invite_users, can_restrict_members, can_pin_messages,
            can_promote_members, can_manage_video_chats
        } = req.body;

        if (!groupId || !userId) {
            res.status(400).json({ message: "Требуется ID группы и ID пользователя" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        const memberCheckUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMember`;
        const memberCheckResponse = await fetch(memberCheckUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: groupId, user_id: parseInt(userId) })
        });

        const memberCheckResult = await memberCheckResponse.json();

        if (!memberCheckResponse.ok) {
            if (memberCheckResult.error_code === 400 && memberCheckResult.description?.includes('user not found')) {
                res.status(400).json({
                    message: "Пользователь не является участником группы",
                    error: "Пользователь не является участником группы. Сначала пригласите пользователя в группу."
                });
                return;
            }
            res.status(400).json({
                message: "Не удалось проверить членство пользователя",
                error: memberCheckResult.description || "Неизвестная ошибка"
            });
            return;
        }

        const memberStatus = memberCheckResult.result?.status;
        if (memberStatus === 'left' || memberStatus === 'kicked') {
            res.status(400).json({
                message: "Пользователь не является участником группы",
                error: "Пользователь покинул группу или был исключен. Сначала пригласите пользователя в группу."
            });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/promoteChatMember`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: groupId,
                user_id: parseInt(userId),
                can_manage_chat: can_manage_chat !== undefined ? can_manage_chat : true,
                can_change_info: can_change_info !== undefined ? can_change_info : true,
                can_delete_messages: can_delete_messages !== undefined ? can_delete_messages : true,
                can_invite_users: can_invite_users !== undefined ? can_invite_users : true,
                can_restrict_members: can_restrict_members !== undefined ? can_restrict_members : true,
                can_pin_messages: can_pin_messages !== undefined ? can_pin_messages : true,
                can_promote_members: can_promote_members !== undefined ? can_promote_members : true,
                can_manage_video_chats: can_manage_video_chats !== undefined ? can_manage_video_chats : true,
                can_post_stories: true,
                can_edit_stories: true,
                can_delete_stories: true,
                is_anonymous: true
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Telegram API error:', result);
            res.status(400).json({
                message: "Не удалось повысить участника",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ success: true, message: "Участник повышен" });
    } catch (error) {
        console.error("Ошибка повышения участника:", error);
        res.status(500).json({ message: "Не удалось повысить участника" });
    }
}
