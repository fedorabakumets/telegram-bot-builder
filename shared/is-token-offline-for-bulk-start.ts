/**
 * @fileoverview Токен считается офлайн для массового запуска, если процесс не running и токен живой
 * @module shared/is-token-offline-for-bulk-start
 */

import { isTokenActiveForBroadcast } from './broadcast-unauthorized';

/**
 * Нужно ли поднимать токен кнопкой «Запустить офлайн».
 * Недействительный токен (isActive === 0) не стартуем — Telegram его уже отклонил.
 *
 * @param status - Статус экземпляра бота или null/undefined
 * @param isActive - Флаг isActive токена (0 — недействителен)
 * @returns true, если токен нужно запускать
 */
export function isTokenOfflineForBulkStart(
  status: string | null | undefined,
  isActive?: number | null,
): boolean {
  if (!isTokenActiveForBroadcast(isActive)) return false;
  return status !== 'running';
}
