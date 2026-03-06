/**
 * @fileoverview Валидация username Telegram
 * @module server/telegram/utils/validation/validate-username
 * @description Проверяет корректность username
 */

import { ValidationErrorCode } from '../../types/validation-error-code.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Валидирует username Telegram
 * @param username - Username для валидации
 * @returns Результат валидации
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || username.trim() === '') {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.USERNAME_INVALID,
        message: 'Username не может быть пустым',
        field: 'username',
      }],
    };
  }

  const usernameRegex = /^@[a-zA-Z0-9_]{5,32}$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.USERNAME_INVALID,
        message: 'Username должен начинаться с @ и содержать от 5 до 32 символов',
        field: 'username',
      }],
    };
  }

  return { isValid: true, errors: [] };
}
