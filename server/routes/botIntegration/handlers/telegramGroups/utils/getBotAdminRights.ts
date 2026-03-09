/**
 * @fileoverview Утилита получения прав бота
 *
 * Этот модуль предоставляет функцию для получения прав
 * бота из списка администраторов.
 *
 * @module botIntegration/handlers/telegramGroups/utils/getBotAdminRights
 */

/**
 * Получает права бота из списка администраторов
 *
 * @function getBotAdminRights
 * @param {any[]} admins - Список администраторов
 * @param {number} botId - ID бота
 * @returns {Object | null} Права бота или null
 */
export function getBotAdminRights(admins: any[], botId: number) {
    const botAdmin = admins.find((admin: any) =>
        admin.user && admin.user.id === botId
    );

    if (!botAdmin || botAdmin.status !== 'administrator') {
        return null;
    }

    return {
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
