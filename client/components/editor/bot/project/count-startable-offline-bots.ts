/**
 * @fileoverview Счётчик ботов, которых можно поднять кнопкой «Запустить офлайн»
 * @module editor/bot/project/count-startable-offline-bots
 */

import { isTokenOfflineForBulkStart } from '@shared/is-token-offline-for-bulk-start';

/** Токен с флагом активности */
interface OfflineCountToken {
  /** ID токена */
  id: number;
  /** 0 — Telegram отклонил токен */
  isActive?: number | null;
}

/** Статус процесса бота */
interface OfflineCountStatus {
  /** ID токена */
  tokenId: number;
  /** running / stopped / … */
  status?: string | null;
}

/**
 * Считает остановленных ботов с действительным токеном.
 * Недействительные токены в счётчик не входят.
 *
 * @param tokens - Токены проекта
 * @param statuses - Статусы процессов
 * @returns Число ботов для массового старта
 */
export function countStartableOfflineBots(
  tokens: OfflineCountToken[],
  statuses: OfflineCountStatus[],
): number {
  return tokens.filter((token) => {
    const status = statuses.find((entry) => entry.tokenId === token.id);
    return isTokenOfflineForBulkStart(status?.status, token.isActive);
  }).length;
}
