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
 * @param isActive - Флаг isActive токена (0 — Telegram отклонил)
 * @returns Подсказка для UI или null, если токен можно стартовать
 */
export function refuseInactiveBotStart(isActive?: number | null): string | null {
  if (isTokenActiveForBroadcast(isActive)) return null;
  return BOT_UNAUTHORIZED_HINT;
}
