/**
 * @fileoverview Валидация Chat ID
 * @module server/telegram/utils/validation/validate-chat-id
 * @description Проверяет корректность Chat ID
 */

import { ValidationErrorCode } from '../../types/validation-error-code.js';
import type { ValidationResult } from '../../types/validation-result.js';

/**
 * Валидирует Chat ID
 * @param chatId - Chat ID для валидации
 * @returns Результат валидации
 */
export function validateChatId(chatId: string | number): ValidationResult {
  const id = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;

  if (isNaN(id)) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.CHAT_ID_INVALID,
        message: 'Chat ID должен быть числом',
        field: 'chatId',
      }],
    };
  }

  if (id === 0) {
    return {
      isValid: false,
      errors: [{
        code: ValidationErrorCode.CHAT_ID_INVALID,
        message: 'Chat ID не может быть равен 0',
        field: 'chatId',
      }],
    };
  }

  return { isValid: true, errors: [] };
}
