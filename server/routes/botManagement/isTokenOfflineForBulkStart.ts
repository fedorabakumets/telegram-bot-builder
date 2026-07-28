/**
 * @fileoverview Хелпер: считать токен офлайн для bulk start-offline-all
 * @module server/routes/botManagement/isTokenOfflineForBulkStart
 */

/**
 * Токен считается офлайн, если нет instance или status !== 'running'
 * @param status - Статус экземпляра бота или null/undefined
 * @returns true если нужно запускать
 */
export function isTokenOfflineForBulkStart(status: string | null | undefined): boolean {
  return status !== 'running';
}
