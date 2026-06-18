/**
 * @fileoverview In-memory карта активных launchId по tokenId для привязки логов к запуску
 * @module server/terminal/activeLaunchIds
 */

/** tokenId → id записи в bot_launch_history */
const activeLaunchIds = new Map<number, number>();

/**
 * Сохраняет активный launchId для токена
 * @param tokenId - Идентификатор токена
 * @param launchId - Идентификатор записи истории запуска
 */
export function setActiveLaunchId(tokenId: number, launchId: number): void {
  activeLaunchIds.set(tokenId, launchId);
}

/**
 * Возвращает активный launchId токена
 * @param tokenId - Идентификатор токена
 * @returns launchId или undefined
 */
export function getActiveLaunchId(tokenId: number): number | undefined {
  return activeLaunchIds.get(tokenId);
}

/**
 * Удаляет активный launchId токена из памяти
 * @param tokenId - Идентификатор токена
 */
export function clearActiveLaunchId(tokenId: number): void {
  activeLaunchIds.delete(tokenId);
}
