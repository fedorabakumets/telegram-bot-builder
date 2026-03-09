/**
 * @fileoverview Утилита обновления данных участника
 *
 * Этот модуль предоставляет функцию для создания
 * объекта обновления данных участника.
 *
 * @module botIntegration/handlers/telegramGroups/utils/updateMemberData
 */

import { createAdminRights } from "./createAdminRights";

/**
 * Создаёт данные для обновления участника
 *
 * @function updateMemberData
 * @param {any} member - Данные участника из Telegram
 * @param {any} existingMember - Существующий участник в БД
 * @returns {Object} Данные для обновления
 */
export function updateMemberData(member: any, existingMember: any) {
    return {
        status: member.status,
        username: member.user?.username || existingMember.username,
        firstName: member.user?.first_name || existingMember.firstName,
        lastName: member.user?.last_name || existingMember.lastName,
        isActive: 1,
        adminRights: createAdminRights(member),
        customTitle: member.custom_title || existingMember.customTitle,
        restrictions: existingMember.restrictions || {},
        messageCount: existingMember.messageCount || 0,
        lastSeen: new Date()
    };
}
