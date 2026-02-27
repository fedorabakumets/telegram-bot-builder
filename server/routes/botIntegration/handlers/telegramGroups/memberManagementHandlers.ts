/**
 * @fileoverview Хендлеры управления участниками группы
 *
 * Этот модуль предоставляет функции для обработки запросов
 * на бан, разбан, повышение и понижение участников группы.
 *
 * @module botIntegration/handlers/telegramGroups/memberManagementHandlers
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на бан участника
 */
export async function banMemberHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, userId, untilDate } = req.body;

        if (!groupId || !userId) {
            res.status(400).json({ message: "Требуется ID группы и ID пользователя" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/banChatMember`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: groupId,
                user_id: userId,
                until_date: untilDate || undefined
            })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось забанить участника",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ success: true, message: "Участник забанен" });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка бана участника:", errorInfo);
        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}

/**
 * Обрабатывает запрос на разбан участника
 */
export async function unbanMemberHandler(req: Request, res: Response): Promise<void> {
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

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/unbanChatMember`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: groupId,
                user_id: userId,
                only_if_banned: true
            })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось разбанить участника",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        res.json({ success: true, message: "Участник разбанен" });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка разбана участника:", errorInfo);
        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}

/**
 * Обрабатывает запрос на повышение участника
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

/**
 * Обрабатывает запрос на понижение участника
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
        const response = await fetch(telegramApiUrl, {
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
