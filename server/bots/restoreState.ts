/**
 * @fileoverview In-memory состояние restore после рестарта сервера.
 * Пока restore идёт — токены в pending-наборе; bulk-start их не трогает.
 * @module server/bots/restoreState
 */

/** tokenId → true, пока бот ещё не обработан restore */
const pendingTokenIds = new Set<number>();

let restoreInProgress = false;

/**
 * Начать restore: запомнить все tokenId, которые предстоит поднять.
 * @param tokenIds - ID токенов из списка restore
 */
export function markRestoreStarted(tokenIds: number[]): void {
  pendingTokenIds.clear();
  for (const id of tokenIds) {
    pendingTokenIds.add(id);
  }
  restoreInProgress = true;
}

/**
 * Бот обработан restore (успех или исчерпаны попытки).
 * @param tokenId - ID токена
 */
export function markTokenRestored(tokenId: number): void {
  pendingTokenIds.delete(tokenId);
}

/**
 * Restore завершён (все группы отработали).
 */
export function markRestoreFinished(): void {
  restoreInProgress = false;
  pendingTokenIds.clear();
}

/**
 * Идёт ли restore прямо сейчас.
 * @returns true если restoreInProgress
 */
export function isRestoreInProgress(): boolean {
  return restoreInProgress;
}

/**
 * Ждёт ли токен своей очереди в restore.
 * @param tokenId - ID токена
 * @returns true если токен ещё в pending-наборе
 */
export function isTokenPendingRestore(tokenId: number): boolean {
  return pendingTokenIds.has(tokenId);
}

/**
 * Сброс состояния (только для тестов).
 */
export function resetRestoreState(): void {
  restoreInProgress = false;
  pendingTokenIds.clear();
}
