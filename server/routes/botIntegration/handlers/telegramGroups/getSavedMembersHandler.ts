/**
 * @fileoverview Хендлер получения сохранённых участников группы
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение сохранённых участников группы из базы данных.
 *
 * @module botIntegration/handlers/telegramGroups/getSavedMembersHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import {
    analyzeTelegramError,
    getErrorStatusCode
} from "../../../../utils/telegram-error-handler";

/**
 * Обрабатывает запрос на получение сохранённых участников
 *
 * @function getSavedMembersHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getSavedMembersHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const { groupId } = req.params;

        if (!groupId || groupId === "null") {
            res.status(400).json({ message: "Требуется ID группы" });
            return;
        }

        const group = await storage.getBotGroupByProjectAndGroupId(projectId, groupId);
        if (!group) {
            res.json({ members: [] });
            return;
        }

        const savedMembers = await storage.getGroupMembers(group.id);

        const members = savedMembers.map(member => ({
            user: {
                id: member.userId,
                username: member.username || undefined,
                first_name: member.firstName || undefined,
                last_name: member.lastName || undefined,
                is_bot: member.isBot === 1
            },
            status: member.status,
            custom_title: member.customTitle || undefined,
            friendlyStatus: {
                'creator': 'Создатель',
                'administrator': 'Администратор',
                'member': 'Участник',
                'restricted': 'Ограничен',
                'left': 'Покинул группу',
                'kicked': 'Исключен'
            }[member.status as keyof typeof member.status] || member.status,
            savedFromDatabase: true,
            lastSeen: member.lastSeen,
            messageCount: member.messageCount,
            ...(typeof member.adminRights === 'object' && member.adminRights ? member.adminRights : {})
        }));

        console.log(`✅ Загружено ${members.length} сохранённых участников группы ${groupId} из базы данных`);
        res.json({ members });
    } catch (error) {
        const errorInfo = analyzeTelegramError(error);
        console.error("Ошибка получения сохранённых участников:", errorInfo);
        const statusCode = getErrorStatusCode(errorInfo.type);
        res.status(statusCode).json({
            message: errorInfo.userFriendlyMessage,
            errorType: errorInfo.type,
            details: process.env.NODE_ENV === 'development' ? errorInfo.message : undefined
        });
    }
}
