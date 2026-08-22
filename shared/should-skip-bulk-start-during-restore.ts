/**
 * @fileoverview Пропуск bulk start-offline для токенов в очереди restore
 * @module shared/should-skip-bulk-start-during-restore
 */

/**
 * Нужно ли пропустить токен при start-offline-all, потому что restore ещё не дошёл до него.
 *
 * @param isPendingRestore - true если isTokenPendingRestore(tokenId)
 * @returns true — не запускать вручную, ждать restore
 */
export function shouldSkipBulkStartDuringRestore(isPendingRestore: boolean): boolean {
  return isPendingRestore;
}
