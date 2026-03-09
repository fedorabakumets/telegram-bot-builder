/**
 * @fileoverview Комбинирование результатов валидации
 * @module server/telegram/utils/validation/combine-validation-results
 * @description Объединяет несколько результатов валидации в один
 */

import type { ValidationResult } from '../../types/validation-result.js';
import type { ValidationError } from '../../types/validation-error.js';

/**
 * Комбинирует несколько результатов валидации
 * @param results - Массив результатов валидации
 * @returns Объединённый результат
 */
export function combineValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const result of results) {
    if (!result.isValid) {
      allErrors.push(...result.errors);
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}
