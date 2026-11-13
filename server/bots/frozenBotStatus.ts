/** @fileoverview Распознавание и привязка подтверждённого ограничения Telegram к личности бота. */

/** Определяет заморозку только по явному коду Telegram, отдельно от недействительного токена. */
export function isFrozenBotError(value: unknown): boolean {
  return typeof value === 'string' && /\bFROZEN_METHOD_INVALID\b/i.test(value);
}

/** Подтверждённые ограничения после запуска панели; остановка процесса их не снимает. */
const frozenBots = new Set<string>();
/** Числовая личность Telegram-бота без хранения секретной части токена. */
const botIdentities = new Map<string, string>();

/**
 * Привязывает слот к Telegram-боту; ротация секрета того же бота сохраняет ограничение.
 * @param projectId - Идентификатор проекта.
 * @param tokenId - Идентификатор слота токена.
 * @param token - Актуальный токен, используется только открытый числовой префикс.
 */
export function bindFrozenBotIdentity(projectId: number, tokenId: number, token: string): void {
  const identity = /^(\d+):/.exec(token)?.[1];
  if (!identity) return;
  const key = `${projectId}:${tokenId}`;
  const previous = botIdentities.get(key);
  if (previous && previous !== identity) frozenBots.delete(key);
  botIdentities.set(key, identity);
}

/** Запоминает явную ошибку Telegram, не изменяя состояние запуска процесса. */
export function recordFrozenBotError(projectId: number, tokenId: number, content: string): boolean {
  if (!isFrozenBotError(content)) return false;
  frozenBots.add(`${projectId}:${tokenId}`);
  return true;
}

/** Возвращает ограничение текущего бота; другой бот в прежнем слоте не наследует заморозку. */
export function isBotFrozen(projectId: number, tokenId: number, token?: string): boolean {
  if (token) bindFrozenBotIdentity(projectId, tokenId, token);
  return frozenBots.has(`${projectId}:${tokenId}`);
}
