/**
 * @fileoverview Хендлер получения списка администраторов группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка администраторов группы через Telegram Bot API.
 *
 * @module botIntegration/handlers/telegramGroups/getGroupAdminsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на получение списка администраторов
 *
 * @function getGroupAdminsHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getGroupAdminsHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId } = req.params;

        if (!groupId || groupId === "null") {
            res.status(400).json({ message: "Требуется ID группы" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatAdministrators`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ chat_id: groupId })
        });

        const result = await response.json();

        if (!response.ok) {
            res.status(400).json({
                message: "Не удалось получить список администраторов",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        let botAdminRights = null;
        const botUser = await fetch(`https://api.telegram.org/bot${defaultToken.token}/getMe`);
        const botInfo = await botUser.json();

        if (botUser.ok && result.result) {
            const botAdmin = result.result.find((admin: any) =>
                admin.user && admin.user.id === botInfo.result.id
            );

            if (botAdmin && botAdmin.status === 'administrator') {
                botAdminRights = {
                    can_manage_chat: botAdmin.can_manage_chat || false,
                    can_change_info: botAdmin.can_change_info || false,
                    can_delete_messages: botAdmin.can_delete_messages || false,
                    can_invite_users: botAdmin.can_invite_users || false,
                    can_restrict_members: botAdmin.can_restrict_members || false,
                    can_pin_messages: botAdmin.can_pin_messages || false,
                    can_promote_members: botAdmin.can_promote_members || false,
                    can_manage_video_chats: botAdmin.can_manage_video_chats || false
                };
            }
        }

        res.json({
            administrators: result.result,
            botAdminRights: botAdminRights
        });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка получения списка администраторов:", errorInfo);

        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
