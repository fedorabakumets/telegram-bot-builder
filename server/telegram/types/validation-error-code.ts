/**
 * @fileoverview Коды ошибок валидации для Telegram модуля
 * @module server/telegram/types/validation-error-code
 * @description Перечисление кодов ошибок валидации
 */

/**
 * Коды ошибок валидации
 */
export enum ValidationErrorCode {
  /** Неверный формат API ID */
  API_ID_INVALID = 'API_ID_INVALID',
  /** Неверный формат API Hash */
  API_HASH_INVALID = 'API_HASH_INVALID',
  /** Неверный формат токена бота */
  BOT_TOKEN_INVALID = 'BOT_TOKEN_INVALID',
  /** Неверный формат номера телефона */
  PHONE_INVALID = 'PHONE_INVALID',
  /** Неверный формат session строки */
  SESSION_INVALID = 'SESSION_INVALID',
  /** Неверный формат chat ID */
  CHAT_ID_INVALID = 'CHAT_ID_INVALID',
  /** Неверный формат user ID */
  USER_ID_INVALID = 'USER_ID_INVALID',
  /** Неверный формат username */
  USERNAME_INVALID = 'USERNAME_INVALID',
  /** Пустое обязательное поле */
  REQUIRED = 'REQUIRED',
  /** Слишком короткое значение */
  TOO_SHORT = 'TOO_SHORT',
  /** Слишком длинное значение */
  TOO_LONG = 'TOO_LONG',
  /** Неверный формат файла */
  FILE_INVALID = 'FILE_INVALID',
  /** Неверный формат прав администратора */
  ADMIN_RIGHTS_INVALID = 'ADMIN_RIGHTS_INVALID',
}
