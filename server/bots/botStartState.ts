/**
 * @fileoverview Учёт незавершённых запусков ботов для защиты истории от преждевременной сверки.
 */
const startingTokens = new Set<number>();

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
