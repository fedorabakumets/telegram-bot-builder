/**
 * @fileoverview Разбор ответа Telegram Bot API на 401 / Unauthorized
 * @module server/bots/telegram-method-unauthorized
 */

import { isBotUnauthorized } from '@shared/broadcast-unauthorized';

/** Тело ошибки метода Telegram Bot API */
interface TelegramApiErrorBody {
  /** Успех метода */
  ok?: boolean;
  /** Код ошибки Telegram */
  error_code?: number;
  /** Описание ошибки */
  description?: string;
}

/**
 * Telegram отклонил токен (HTTP 401 или ok:false + Unauthorized)
 * @param status - HTTP-статус ответа
 * @param body - JSON тела ответа или null
 * @returns true, если токен недействителен
 */
export function isTelegramMethodUnauthorized(
  status: number,
  body: TelegramApiErrorBody | null,
): boolean {
  const errorCode = body?.error_code ?? (status === 401 ? 401 : undefined);
  return isBotUnauthorized(errorCode, body?.description);
}
