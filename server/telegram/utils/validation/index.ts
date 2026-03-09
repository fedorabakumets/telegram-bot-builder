/**
 * @fileoverview Баррер-файл для экспорта всех утилит валидации
 * @module server/telegram/utils/validation/index
 * @description Экспортирует функции и типы для валидации входных данных
 */

// Функции валидации
export { validateApiId } from './validate-api-id.js';
export { validateApiHash } from './validate-api-hash.js';
export { validateBotToken } from './validate-bot-token.js';
export { validatePhoneNumber } from './validate-phone-number.js';
export { validateSessionString } from './validate-session-string.js';
export { validateChatId } from './validate-chat-id.js';
export { validateUserId } from './validate-user-id.js';
export { validateUsername } from './validate-username.js';
export { validateRequired } from './validate-required.js';
export { validateStringLength } from './validate-string-length.js';

// Утилиты
export { assertValid } from './assert-valid.js';
export { combineValidationResults } from './combine-validation-results.js';

// Типы
export { ValidationErrorCode } from '../../types/validation-error-code.js';
export type { ValidationError } from '../../types/validation-error.js';
export type { ValidationResult } from '../../types/validation-result.js';
export { TelegramValidationError } from '../../types/telegram-validation-error.js';
