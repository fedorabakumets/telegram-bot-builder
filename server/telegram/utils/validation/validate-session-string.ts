/**
 * @fileoverview Валидация session строки Telegram
 * @module server/telegram/utils/validation/validate-session-string
 * @description Проверяет корректность session строки
 */

import { ValidationErrorCode } from '../../types/validation-error-code.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Валидирует session строку Telegram
 * @param session - Session строка для валидации
 * @returns Результат валидации
 */
export function validateSessionString(session: string): ValidationResult {
  if (!session || session.trim() === '') {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.SESSION_INVALID,
        message: 'Session строка не может быть пустой',
        field: 'session',
      }],
    };
  }

  if (!session.includes('@')) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.SESSION_INVALID,
        message: 'Неверный формат session строки',
        field: 'session',
      }],
    };
  }

  return { isValid: true, errors: [] };
}
