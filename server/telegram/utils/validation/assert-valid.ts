/**
 * @fileoverview Утилита утверждения валидности
 * @module server/telegram/utils/validation/assert-valid
 * @description Выбрасывает исключение при ошибке валидации
 */

import { TelegramValidationError } from '../../types/telegram-validation-error.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Выбрасывает исключение при ошибке валидации
 * @param result - Результат валидации
 * @throws {TelegramValidationError} Если валидация не пройдена
 */
export function assertValid(result: ValidationResult): void {
  if (!result.isValid && result.errors.length > 0) {
    const error = result.errors[0];
    throw new TelegramValidationError(error.code, error.message, error.field);
  }
}
