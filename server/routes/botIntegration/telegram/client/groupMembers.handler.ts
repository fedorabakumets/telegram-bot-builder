/**
 * @fileoverview Обработчик получения участников группы через Telegram Client API
 *
 * @module botIntegration/telegram/client/groupMembers
 */

import type { Request, Response } from "express";
import { telegramClientManager } from "../../../../telegram/telegram-client";

/**
 * Получает участников группы через Telegram Client API
 *
 * @function groupMembersHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @route GET /api/telegram-client/group-members/:groupId
 */
export async function groupMembersHandler(req: Request, res: Response): Promise<void> {
    try {
        const { groupId } = req.params;
        const apiId = process.env.TELEGRAM_API_ID;
        const apiHash = process.env.TELEGRAM_API_HASH;

        if (!apiId || !apiHash) {
            res.json(getDemoData(groupId));
            return;
        }

        const members = await getGroupMembersFromApi(groupId);

        if (members && members.length > 0) {
            res.json({
                success: true,
                message: "Получен полный список участников через Client API",
                explanation: "Client API показывает всех участников, а не только админов",
                groupId,
                memberCount: members.length,
                members: formatMembers(members),
                advantages: [
                    `Показывает всех участников (${members.length})`,
                    "Включает обычных пользователей",
                    "Предоставляет полную информацию",
                    "Обходит ограничения Bot API"
                ]
            });
            return;
        }

        throw new Error('Участники не найдены или Client API не подключен');
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: "Client API требует настройки",
            explanation: "Необходимо настроить Telegram Client API с номером телефона",
            error: error?.message || 'Неизвестная ошибка',
            requirements: [
                "Подключение к Telegram Client API",
                "Авторизация через код подтверждения",
                "Права доступа к данным группы"
            ]
        });
    }
}

/**
 * Получает участников группы из Telegram Client API
 */
async function getGroupMembersFromApi(groupId: string): Promise<any[]> {
    return await telegramClientManager.getGroupMembers('default', groupId);
}

/**
 * Форматирует список участников
 */
function formatMembers(members: any[]): any[] {
    return members.map((member: any) => ({
        id: member.id,
        username: member.username,
        firstName: member.firstName,
        lastName: member.lastName,
        isBot: member.isBot,
        status: member.status,
        joinedAt: member.joinedAt,
        source: "client_api"
    }));
}

/**
 * Возвращает демо-данные при отсутствии настроек API
 */
function getDemoData(groupId: string): any {
    return {
        success: true,
        message: "🎭 Демо-режим: показаны примерные участники",
        explanation: "Настройте TELEGRAM_API_ID и TELEGRAM_API_HASH для реальных данных",
        groupId,
        memberCount: 3,
        members: [
            {
                id: 123456789,
                username: "demo_user1",
                firstName: "Демо",
                lastName: "Пользователь 1",
                isBot: false,
                status: "active",
                joinedAt: new Date().toISOString(),
                source: "demo_data"
            },
            {
                id: 987654321,
                username: "demo_user2",
                firstName: "Демо",
                lastName: "Пользователь 2",
                isBot: false,
                status: "active",
                joinedAt: new Date().toISOString(),
                source: "demo_data"
            },
            {
                id: 555666777,
                username: "demo_bot",
                firstName: "Демо",
                lastName: "Бот",
                isBot: true,
                status: "active",
                joinedAt: new Date().toISOString(),
                source: "demo_data"
            }
        ],
        isDemoMode: true
    };
}
