/**
 * @fileoverview Хендлер понижения участника
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на понижение администратора до обычного участника через Telegram Bot API.
 *
 * @module botIntegration/groups/members/demoteMemberHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Обрабатывает запрос на понижение участника
 *
 * @function demoteMemberHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function demoteMemberHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, userId } = req.body;

        if (!groupId || !userId) {
            res.status(400).json({ message: "Требуется ID группы и ID пользователя" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/promoteChatMember`;
        const response = await fetchWithProxy(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: groupId,
                user_id: userId,
                can_manage_chat: false,
                can_change_info: false,
                can_delete_messages: false,
                can_invite_users: false,
                can_restrict_members: false,
                can_pin_messages: false,
                can_promote_members: false,
                can_manage_video_chats: false
            })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось понизить участника",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ success: true, message: "Участник понижен" });
    } catch (error) {
        console.error("Ошибка понижения участника:", error);
        res.status(500).json({ message: "Не удалось понизить участника" });
    }
}
