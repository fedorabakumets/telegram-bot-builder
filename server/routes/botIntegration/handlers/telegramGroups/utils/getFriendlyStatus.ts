/**
 * @fileoverview Утилита получения дружественного статуса
 *
 * Этот модуль предоставляет функцию для преобразования
 * статуса участника в читаемое название на русском.
 *
 * @module botIntegration/handlers/telegramGroups/utils/getFriendlyStatus
 */

/**
 * Преобразует статус в читаемое название
 *
 * @function getFriendlyStatus
 * @param {string} status - Статус участника
 * @returns {string} Читаемое название
 */
export function getFriendlyStatus(status: string): string {
    const statusMap: Record<string, string> = {
        'creator': 'Создатель',
        'administrator': 'Администратор',
        'member': 'Участник',
        'restricted': 'Ограничен',
        'left': 'Покинул группу',
        'kicked': 'Исключен'
    };

    return statusMap[status] || status;
}
