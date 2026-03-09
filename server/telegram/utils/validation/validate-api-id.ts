/**
 * @fileoverview Валидация API ID Telegram
 * @module server/telegram/utils/validation/validate-api-id
 * @description Проверяет корректность API ID
 */

import { ValidationErrorCode } from '../../types/validation-error-code.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Валидирует API ID Telegram
 * @param apiId - API ID для валидации
 * @returns Результат валидации
 */
export function validateApiId(apiId: string): ValidationResult {
  if (!apiId || apiId.trim() === '') {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.API_ID_INVALID,
        message: 'API ID не может быть пустым',
        field: 'apiId',
      }],
    };
  }

  const apiIdNum = parseInt(apiId, 10);
  if (isNaN(apiIdNum) || apiIdNum <= 0) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.API_ID_INVALID,
        message: 'API ID должен быть положительным числом',
        field: 'apiId',
      }],
    };
  }

  if (apiId.length < 5 || apiId.length > 10) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.API_ID_INVALID,
        message: 'API ID должен содержать от 5 до 10 цифр',
        field: 'apiId',
      }],
    };
  }

  return { isValid: true, errors: [] };
}
