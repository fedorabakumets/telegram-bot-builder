/**
 * @fileoverview Утилита проверки размера группы
 *
 * Этот модуль предоставляет функцию для проверки
 * можно ли получить полный список участников.
 *
 * @module botIntegration/handlers/telegramGroups/utils/checkGroupSize
 */

/**
 * Проверяет размер группы
 *
 * @function checkGroupSize
 * @param {number} membersCount - Количество участников
 * @returns {boolean} true если группа большая (>200)
 */
export function isLargeGroup(membersCount: number): boolean {
    return membersCount > 200;
}

/**
 * Создаёт ответ для большой группы
 *
 * @function createLargeGroupResponse
 * @param {number} membersCount - Количество участников
 * @returns {Object} Ответ с ошибкой
 */
export function createLargeGroupResponse(membersCount: number) {
    return {
        message: "Невозможно получить список участников для больших групп",
        error: "Telegram API позволяет получать полный список участников только для небольших групп (<200 участников). Для больших групп доступны только администраторы.",
        membersCount
    };
}
