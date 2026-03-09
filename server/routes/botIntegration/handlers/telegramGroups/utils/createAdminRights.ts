/**
 * @fileoverview Утилита создания прав администратора
 *
 * Этот модуль предоставляет функцию для создания
 * объекта прав администратора из данных Telegram.
 *
 * @module botIntegration/handlers/telegramGroups/utils/createAdminRights
 */

/**
 * Создаёт объект прав администратора
 *
 * @function createAdminRights
 * @param {any} member - Данные участника из Telegram
 * @returns {Object} Права администратора
 */
export function createAdminRights(member: any) {
    if (member.status !== 'administrator') {
        return {};
    }

    return {
        can_change_info: member.can_change_info || false,
        can_delete_messages: member.can_delete_messages || false,
        can_restrict_members: member.can_restrict_members || false,
        can_invite_users: member.can_invite_users || false,
        can_pin_messages: member.can_pin_messages || false,
        can_promote_members: member.can_promote_members || false,
        can_manage_video_chats: member.can_manage_video_chats || false,
        can_be_anonymous: member.is_anonymous || false
    };
}
