/**
 * @fileoverview Валидация обязательного поля
 * @module server/telegram/utils/validation/validate-required
 * @description Проверяет, что поле не пустое
 */

import { ValidationErrorCode } from '../../types/validation-error-code.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Валидирует обязательное поле
 * @param value - Значение для валидации
 * @param fieldName - Имя поля
 * @returns Результат валидации
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.REQUIRED,
        message: `Поле "${fieldName}" является обязательным`,
        field: fieldName,
      }],
    };
  }

  return { isValid: true, errors: [] };
}
