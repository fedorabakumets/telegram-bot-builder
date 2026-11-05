/**
 * @fileoverview Учёт незавершённых запусков ботов для защиты истории от преждевременной сверки.
 */
const startingTokens = new Set<number>();
/** Сообщение при отмене запуска явной остановкой. */
export const BOT_START_CANCELLED_ERROR = 'Запуск отменён остановкой бота';
/** Версии намерений позволяют отменять ожидающие и отложенные запуски. */
const startRevisions = new Map<number, number>();

/**
 * Возвращает текущую версию намерения запуска.
 * @param tokenId - Идентификатор токена.
 * @returns Версия намерения.
 */
export function getBotStartRevision(tokenId: number): number {
  return startRevisions.get(tokenId) ?? 0;
}

/**
 * Отменяет ранее запланированные или ожидающие запуски токена.
 * @param tokenId - Идентификатор токена.
 */
export function cancelBotStart(tokenId: number): void {
  startRevisions.set(tokenId, getBotStartRevision(tokenId) + 1);
}

/**
 * Регистрирует запуск и предотвращает параллельный запуск того же токена.
 * @param tokenId - Идентификатор токена
 * @returns Зарегистрирован ли новый запуск
 */
export function beginBotStart(tokenId: number): boolean {
  if (startingTokens.has(tokenId)) return false;
  startingTokens.add(tokenId);
  return true;
}

/**
 * Завершает фазу запуска при успехе или ошибке.
 * @param tokenId - Идентификатор токена
 */
export function finishBotStart(tokenId: number): void {
  startingTokens.delete(tokenId);
}

/**
 * Проверяет, продолжается ли подготовка и запуск процесса.
 * @param tokenId - Идентификатор токена
 * @returns Признак незавершённого запуска
 */
export function isBotStarting(tokenId: number): boolean {
  return startingTokens.has(tokenId);
}
