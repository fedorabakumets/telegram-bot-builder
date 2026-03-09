/**
 * @fileoverview Утилита получения участников группы
 *
 * Этот модуль предоставляет функцию для получения
 * списка администраторов группы.
 *
 * @module botIntegration/handlers/telegramGroups/utils/fetchGroupMembers
 */

/**
 * Получает список администраторов группы
 *
 * @function fetchGroupMembers
 * @param {string} token - Токен бота
 * @param {string} groupId - ID группы
 * @returns {Promise<any>} Список участников
 */
export async function fetchGroupMembers(token: string, groupId: string) {
    const response = await fetch(`https://api.telegram.org/bot${token}/getChatAdministrators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: groupId })
    });

    return await response.json();
}

/**
 * Создаёт ответ со списком участников
 *
 * @function createMembersResponse
 * @param {any[]} members - Список участников
 * @param {number | string} totalCount - Общее количество
 * @returns {Object} Ответ
 */
export function createMembersResponse(members: any[], totalCount: number | string) {
    return {
        members,
        isPartialList: true,
        totalCount,
        message: `Группа содержит ${totalCount} участников. Показаны только администраторы (${members.length}).`,
        explanation: "Telegram API ограничивает доступ к списку участников по соображениям приватности. Доступны только администраторы."
    };
}
