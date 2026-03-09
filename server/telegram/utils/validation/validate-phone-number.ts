/**
 * @fileoverview Валидация номера телефона
 * @module server/telegram/utils/validation/validate-phone-number
 * @description Проверяет корректность номера телефона
 */

import { ValidationErrorCode } from '../../types/validation-error-code.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Валидирует номер телефона
 * @param phone - Номер телефона для валидации
 * @returns Результат валидации
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.PHONE_INVALID,
        message: 'Номер телефона не может быть пустым',
        field: 'phone',
      }],
    };
  }

  const cleaned = phone.replace(/[^\d+]/g, '');

  if (!/^\+\d{10,15}$/.test(cleaned)) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.PHONE_INVALID,
        message: 'Номер телефона должен быть в международном формате (например, +79991234567)',
        field: 'phone',
      }],
    };
  }

  return { isValid: true, errors: [] };
}
