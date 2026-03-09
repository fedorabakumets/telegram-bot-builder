/**
 * @fileoverview Валидация API Hash Telegram
 * @module server/telegram/utils/validation/validate-api-hash
 * @description Проверяет корректность API Hash
 */

import { ValidationErrorCode } from '../../types/validation-error-code.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Валидирует API Hash Telegram
 * @param apiHash - API Hash для валидации
 * @returns Результат валидации
 */
export function validateApiHash(apiHash: string): ValidationResult {
  if (!apiHash || apiHash.trim() === '') {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.API_HASH_INVALID,
        message: 'API Hash не может быть пустым',
        field: 'apiHash',
      }],
    };
  }

  if (apiHash.length !== 32) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.API_HASH_INVALID,
        message: 'API Hash должен содержать ровно 32 символа',
        field: 'apiHash',
      }],
    };
  }

  if (!/^[a-f0-9]+$/i.test(apiHash)) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.API_HASH_INVALID,
        message: 'API Hash должен содержать только шестнадцатеричные символы',
        field: 'apiHash',
      }],
    };
  }

  return { isValid: true, errors: [] };
}
