/**
 * @fileoverview Утилита сохранения участника в БД
 *
 * Этот модуль предоставляет функцию для сохранения
 * или обновления участника группы в базе данных.
 *
 * @module botIntegration/handlers/telegramGroups/utils/saveMemberToDb
 */

import { storage } from "../../../../../storages/storage";
import { createMemberData } from "./createMemberData";
import { updateMemberData } from "./updateMemberData";

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
        const existingMember = existingMembers.find((m) => m.userId.toString() === userId);

        if (!existingMember) {
            const memberData = createMemberData(group.id, userId, member);
            await storage.createGroupMember(memberData);
            console.log(`✅ Участник ${member.user?.first_name || userId} сохранен в базу данных`);
        } else {
            const updateData = updateMemberData(member, existingMember);
            await storage.updateGroupMember(existingMember.id, updateData);
            console.log(`✅ Участник ${member.user?.first_name || userId} обновлен в базе данных`);
        }
    } catch (dbError) {
        console.error("Ошибка сохранения участника в базу:", dbError);
    }
}
