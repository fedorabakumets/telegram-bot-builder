/**
 * @fileoverview Результат валидации
 * @module server/telegram/types/validation-result
 * @description Определяет структуру результата валидации
 */

import type { ValidationError } from './validation-error.js';

/**
 * Результат валидации
 */
export interface ValidationResult {
  /** Успешность валидации */
  isValid: boolean;
  /** Список ошибок валидации */
  errors: ValidationError[];
}
