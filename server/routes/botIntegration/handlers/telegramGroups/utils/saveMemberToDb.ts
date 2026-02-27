/**
 * @fileoverview Утилита сохранения участника в БД
 *
 * Этот модуль предоставляет функцию для сохранения
 * или обновления участника группы в базе данных.
 *
 * @module botIntegration/handlers/telegramGroups/utils/saveMemberToDb
 */

import { storage } from "../../../../storages/storage";

/**
 * Сохраняет или обновляет участника в БД
 *
 * @function saveMemberToDb
 * @param {number} projectId - ID проекта
 * @param {string} groupId - ID группы
 * @param {string} userId - ID пользователя
 * @param {any} member - Данные участника из Telegram
 * @returns {Promise<void>}
 */
export async function saveMemberToDb(
    projectId: number,
    groupId: string,
    userId: string,
    member: any
): Promise<void> {
    try {
        const group = await storage.getBotGroupByProjectAndGroupId(projectId, groupId);
        if (!group) {
            return;
        }

        const existingMembers = await storage.getGroupMembers(group.id);
        const existingMember = existingMembers.find(m => m.userId.toString() === userId);

        const adminRights = member.status === 'administrator' ? {
            can_change_info: member.can_change_info || false,
            can_delete_messages: member.can_delete_messages || false,
            can_restrict_members: member.can_restrict_members || false,
            can_invite_users: member.can_invite_users || false,
            can_pin_messages: member.can_pin_messages || false,
            can_promote_members: member.can_promote_members || false,
            can_manage_video_chats: member.can_manage_video_chats || false,
            can_be_anonymous: member.is_anonymous || false
        } : {};

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
                adminRights,
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
                adminRights,
                customTitle: member.custom_title || existingMember.customTitle,
                restrictions: existingMember.restrictions || {},
                messageCount: existingMember.messageCount || 0,
                lastSeen: new Date()
            };

            await storage.updateGroupMember(existingMember.id, updateData);
            console.log(`✅ Участник ${member.user?.first_name || userId} обновлен в базе данных`);
        }
    } catch (dbError) {
        console.error("Ошибка сохранения участника в базу:", dbError);
    }
}
