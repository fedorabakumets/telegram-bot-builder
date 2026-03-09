/**
 * @fileoverview Класс ошибки валидации Telegram
 * @module server/telegram/types/telegram-validation-error
 * @description Класс исключения для ошибок валидации
 */

import { ValidationErrorCode } from './validation-error-code.js';

/**
 * Класс ошибки валидации для выбрасывания исключений
 */
export class TelegramValidationError extends Error {
  /** Код ошибки */
  public readonly code: ValidationErrorCode;
  /** Поле, в котором произошла ошибка */
  public readonly field?: string;

  constructor(code: ValidationErrorCode, message: string, field?: string) {
    super(message);
    this.name = 'TelegramValidationError';
    this.code = code;
    this.field = field;
  }
}
