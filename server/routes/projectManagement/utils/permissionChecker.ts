/**
 * @fileoverview Утилита проверки прав доступа к проекту
 *
 * Этот модуль предоставляет функции для проверки прав пользователя
 * на выполнение операций с проектом.
 *
 * @module projectManagement/utils/permissionChecker
 */

/**
 * Проверяет право пользователя на удаление проекта
 *
 * @function canDeleteProject
 * @param {number | null} ownerId - Идентификатор владельца проекта
 * @param {number | null} requestOwnerId - Идентификатор пользователя из запроса
 * @returns {boolean} true, если пользователь может удалить проект
 *
 * @description
 * Разрешает удаление если:
 * - Проект гостевой (ownerId === null)
 * - Пользователь является владельцем проекта
 */
export function canDeleteProject(
    ownerId: number | null,
    requestOwnerId: number | null
): boolean {
    if (ownerId === null) {
        return true;
    }

    if (requestOwnerId === null) {
        return false;
    }

    return ownerId === requestOwnerId;
}
