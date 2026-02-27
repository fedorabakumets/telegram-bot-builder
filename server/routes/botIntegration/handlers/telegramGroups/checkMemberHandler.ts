/**
 * @fileoverview Хендлер проверки статуса участника
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на проверку статуса участника группы.
 *
 * @module botIntegration/handlers/telegramGroups/checkMemberHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на проверку статуса участника
 *
 * @function checkMemberHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function checkMemberHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId, userId } = req.params;

        if (!groupId || groupId === "null" || !userId) {
            res.status(400).json({ message: "Требуется ID группы и ID пользователя" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        const telegramApiUrl = `https://api.telegram.org/bot${defaultToken.token}/getChatMember`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: groupId, user_id: parseInt(userId) })
        });

        const result = await response.json();

        console.log("Telegram API response for check member:", {
            ok: response.ok,
            status: response.status,
            result: result,
            groupId: groupId,
            userId: userId
        });

        if (!response.ok) {
            console.error("Failed to check member status via Telegram API:", result);
            if (result.description && result.description.includes("user not found")) {
                res.status(400).json({
                    message: "Пользователь не найден",
                    error: "Пользователь не найден. Убедитесь, что вы указали правильный @username или числовой ID."
                });
                return;
            }
            res.status(400).json({
                message: "Не удалось проверить статус участника",
                error: result.description || "Неизвестная ошибка"
            });
            return;
        }

        const member = result.result;
        const friendlyStatus: Record<string, string> = {
            'creator': 'Создатель',
            'administrator': 'Администратор',
            'member': 'Участник',
            'restricted': 'Ограничен',
            'left': 'Покинул группу',
            'kicked': 'Исключен'
        };

        try {
            const group = await storage.getBotGroupByProjectAndGroupId(projectId, groupId);
            if (group) {
                const existingMembers = await storage.getGroupMembers(group.id);
                const existingMember = existingMembers.find(m => m.userId.toString() === userId);

                if (!existingMember) {
                    const memberData = {
                        groupId: group.id,
                        userId: parseInt(userId),
                        username: member.user?.username || null,
                        firstName: member.user?.first_name || null,
                        lastName: member.user?.last_name || null,
                        status: member.status,
                        isBot: member.user?.is_bot ? 1 : 0,
                        isActive: 1,
                        adminRights: member.status === 'administrator' ? {
                            can_change_info: member.can_change_info || false,
                            can_delete_messages: member.can_delete_messages || false,
                            can_restrict_members: member.can_restrict_members || false,
                            can_invite_users: member.can_invite_users || false,
                            can_pin_messages: member.can_pin_messages || false,
                            can_promote_members: member.can_promote_members || false,
                            can_manage_video_chats: member.can_manage_video_chats || false,
                            can_be_anonymous: member.is_anonymous || false
                        } : {},
                        customTitle: member.custom_title || null,
                        restrictions: {},
                        messageCount: 0,
                        lastSeen: new Date()
                    };

                    await storage.createGroupMember(memberData);
                    console.log(`✅ Участник ${member.user?.first_name || userId} сохранен в базу данных`);
                } else {
                    const updateData = {
                        status: member.status,
                        username: member.user?.username || existingMember.username,
                        firstName: member.user?.first_name || existingMember.firstName,
                        lastName: member.user?.last_name || existingMember.lastName,
                        isActive: 1,
                        adminRights: member.status === 'administrator' ? {
                            can_change_info: member.can_change_info || false,
                            can_delete_messages: member.can_delete_messages || false,
                            can_restrict_members: member.can_restrict_members || false,
                            can_invite_users: member.can_invite_users || false,
                            can_pin_messages: member.can_pin_messages || false,
                            can_promote_members: member.can_promote_members || false,
                            can_manage_video_chats: member.can_manage_video_chats || false,
                            can_be_anonymous: member.is_anonymous || false
                        } : {},
                        customTitle: member.custom_title || existingMember.customTitle,
                        restrictions: existingMember.restrictions || {},
                        messageCount: existingMember.messageCount || 0,
                        lastSeen: new Date()
                    };

                    await storage.updateGroupMember(existingMember.id, updateData);
                    console.log(`✅ Участник ${member.user?.first_name || userId} обновлен в базе данных`);
                }
            }
        } catch (dbError) {
            console.error("Ошибка сохранения участника в базу:", dbError);
        }

        const responseData = {
            member: {
                ...member,
                friendlyStatus: friendlyStatus[member.status] || member.status
            }
        };

        console.log("Sending response:", responseData);
        res.json(responseData);
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка проверки статуса участника:", errorInfo);
        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
