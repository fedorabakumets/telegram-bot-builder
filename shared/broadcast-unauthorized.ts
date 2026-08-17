/**
 * @fileoverview Маркер и подпись ошибки «токен бота не авторизован» в рассылке
 * @module shared/broadcast-unauthorized
 */

/** Служебный userId результата — не получатель, а ошибка токена бота */
export const BOT_UNAUTHORIZED_RESULT_USER_ID = '__bot_unauthorized__';

/** Текст для UI: токен отозван или бот удалён */
export const BOT_UNAUTHORIZED_HINT =
  'Токен недействителен. Получите новый в @BotFather и обновите в настройках проекта.';

/** Нет ни одного бота с действительным токеном для рассылки */
export const NO_ACTIVE_BOT_TOKENS_ERROR =
  'Нет ботов с действительным токеном. Обновите токен в настройках проекта.';

/**
 * Проверяет, что Telegram отклонил токен бота (не пользователь)
 * @param errorCode - Код ошибки Telegram
 * @param description - Описание ошибки
 * @returns true, если это 401 / Unauthorized
 */
export function isBotUnauthorized(errorCode?: number, description?: string): boolean {
  if (errorCode === 401) return true;
  const text = (description ?? '').toLowerCase();
  return text.includes('unauthorized');
}

/**
 * Токен можно использовать в рассылке (не отозван Telegram)
 * @param isActive - Флаг активности токена
 * @returns false, если токен помечен неактивным
 */
export function isTokenActiveForBroadcast(isActive?: number | null): boolean {
  return isActive !== 0;
}

/**
 * Это служебная запись об ошибке токена, а не строка получателя
 * @param userId - userId из broadcast_results
 * @returns true, если запись служебная
 */
export function isBotUnauthorizedResult(userId: string): boolean {
  return userId === BOT_UNAUTHORIZED_RESULT_USER_ID;
}
