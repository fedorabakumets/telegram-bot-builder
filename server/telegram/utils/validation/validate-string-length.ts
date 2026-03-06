/**
 * @fileoverview Валидация длины строки
 * @module server/telegram/utils/validation/validate-string-length
 * @description Проверяет длину строки на соответствие диапазону
 */

import { ValidationErrorCode } from '../../types/validation-error-code.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Валидирует длину строки
 * @param value - Строка для валидации
 * @param min - Минимальная длина
 * @param max - Максимальная длина
 * @param fieldName - Имя поля
 * @returns Результат валидации
 */
export function validateStringLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  if (value.length < min) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.TOO_SHORT,
        message: `Поле "${fieldName}" должно содержать не менее ${min} символов`,
        field: fieldName,
      }],
    };
  }

  if (value.length > max) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.TOO_LONG,
        message: `Поле "${fieldName}" должно содержать не более ${max} символов`,
        field: fieldName,
      }],
    };
  }

  return { isValid: true, errors: [] };
}
