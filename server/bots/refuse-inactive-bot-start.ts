/**
 * @fileoverview Отказ запуска бота, если Telegram уже отклонил токен
 * @module server/bots/refuse-inactive-bot-start
 */

import {
  BOT_UNAUTHORIZED_HINT,
  isTokenActiveForBroadcast,
} from '@shared/broadcast-unauthorized';

/**
 * Текст ошибки запуска при недействительном токене, иначе null
 * @param isActive - Флаг активности токена (0 — отключён)
 * @param authorizationError - Подтверждённый отказ Telegram
 * @returns Подсказка для UI или null, если токен можно стартовать
 */
export function refuseInactiveBotStart(isActive?: number | null, authorizationError?: string | null): string | null {
  if (authorizationError === 'unauthorized') return BOT_UNAUTHORIZED_HINT;
  if (isTokenActiveForBroadcast(isActive)) return null;
  return 'Бот отключён. Включите его в настройках перед запуском.';
}
