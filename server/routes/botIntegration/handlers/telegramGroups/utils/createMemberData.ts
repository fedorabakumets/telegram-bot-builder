/**
 * @fileoverview Утилита создания данных участника
 *
 * Этот модуль предоставляет функцию для создания
 * объекта данных нового участника.
 *
 * @module botIntegration/handlers/telegramGroups/utils/createMemberData
 */

import { createAdminRights } from "./createAdminRights";

/**
 * Создаёт данные нового участника
 *
 * @function createMemberData
 * @param {number} groupId - Внутренний ID группы
 * @param {string} userId - ID пользователя
 * @param {any} member - Данные участника из Telegram
 * @returns {Object} Данные участника
 */
export function createMemberData(groupId: number, userId: string, member: any) {
    return {
        groupId,
        userId: parseInt(userId),
        username: member.user?.username || null,
        firstName: member.user?.first_name || null,
        lastName: member.user?.last_name || null,
        status: member.status,
        isBot: member.user?.is_bot ? 1 : 0,
        isActive: 1,
        adminRights: createAdminRights(member),
        customTitle: member.custom_title || null,
        restrictions: {},
        messageCount: 0,
        lastSeen: new Date()
    };
}
