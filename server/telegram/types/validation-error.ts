/**
 * @fileoverview Интерфейс ошибки валидации
 * @module server/telegram/types/validation-error
 * @description Определяет структуру ошибки валидации
 */

import type { ValidationErrorCode } from './validation-error-code.js';

/**
 * Ошибка валидации
 */
export interface ValidationError {
  /** Код ошибки */
  code: ValidationErrorCode;
  /** Поле, в котором произошла ошибка */
  field?: string;
  /** Сообщение об ошибке */
  message: string;
}
