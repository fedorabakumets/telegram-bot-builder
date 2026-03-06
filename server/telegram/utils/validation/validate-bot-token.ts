/**
 * @fileoverview Валидация токена бота Telegram
 * @module server/telegram/utils/validation/validate-bot-token
 * @description Проверяет корректность токена бота
 */

import { ValidationErrorCode } from '../../types/validation-error-code.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Валидирует токен бота Telegram
 * @param token - Токен бота для валидации
 * @returns Результат валидации
 */
export function validateBotToken(token: string): ValidationResult {
  if (!token || token.trim() === '') {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.BOT_TOKEN_INVALID,
        message: 'Токен бота не может быть пустым',
        field: 'token',
      }],
    };
  }

  const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
  if (!tokenRegex.test(token)) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.BOT_TOKEN_INVALID,
        message: 'Неверный формат токена бота',
        field: 'token',
      }],
    };
  }

  if (token.length < 40 || token.length > 60) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.BOT_TOKEN_INVALID,
        message: 'Токен бота имеет неверную длину',
        field: 'token',
      }],
    };
  }

  return { isValid: true, errors: [] };
}
