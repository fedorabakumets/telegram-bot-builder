/** @fileoverview Распознавание подтверждённого Telegram ограничения бота. */

/**
 * Определяет заморозку только по явному коду Telegram.
 * @param value - Сообщение или описание ошибки Telegram
 * @returns Признак подтверждённой заморозки
 */
export function isFrozenBotError(value: unknown): boolean {
  return typeof value === 'string' && /\bFROZEN_METHOD_INVALID\b/i.test(value);
}

/** Подтверждённые ограничения, обнаруженные после запуска панели. */
const frozenBots = new Set<string>();

/** Запоминает явную ошибку Telegram для конкретного бота.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @param content - Текст ответа или журнала
 * @returns Признак распознанной ошибки
 */
export function recordFrozenBotError(projectId: number, tokenId: number, content: string): boolean {
  if (!isFrozenBotError(content)) return false;
  frozenBots.add(`${projectId}:${tokenId}`);
  return true;
}

/** Возвращает обнаруженный признак ограничения.
 * @param projectId - Идентификатор проекта
 * @param tokenId - Идентификатор токена
 * @returns Признак ранее полученной ошибки
 */
export function isBotFrozen(projectId: number, tokenId: number): boolean {
  return frozenBots.has(`${projectId}:${tokenId}`);
}
