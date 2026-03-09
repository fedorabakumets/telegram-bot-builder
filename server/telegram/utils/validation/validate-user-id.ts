/**
 * @fileoverview Валидация User ID
 * @module server/telegram/utils/validation/validate-user-id
 * @description Проверяет корректность User ID
 */

import { ValidationErrorCode } from '../../types/validation-error-code.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Валидирует User ID
 * @param userId - User ID для валидации
 * @returns Результат валидации
 */
export function validateUserId(userId: string | number): ValidationResult {
  const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;

  if (isNaN(id)) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.USER_ID_INVALID,
        message: 'User ID должен быть числом',
        field: 'userId',
      }],
    };
  }

  if (id <= 0) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.USER_ID_INVALID,
        message: 'User ID должен быть положительным числом',
        field: 'userId',
      }],
    };
  }

  return { isValid: true, errors: [] };
}
