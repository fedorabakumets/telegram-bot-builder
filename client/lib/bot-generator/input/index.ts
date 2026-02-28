/**
 * @fileoverview Экспорт модуля пользовательского ввода
 * Агрегирует функции для работы с вводом пользователя
 */

// Обработчики ввода
export {
  generateButtonResponseHandlersForInput,
  generateAdHocInputHandler
} from './generate-user-input-handlers';

// Валидация и продолжение
export { generateUserInputValidationAndContinuationLogic } from './generate-validation-continuation';

// Валидация - главная функция
export { generateUserInputValidation } from './generate-validation';

// Валидация по типам (для переиспользования)
export { generateLengthValidation } from './validate-length';
export { generateMinLengthValidation, generateMaxLengthValidation } from './validate-length';
export { generateEmailValidation } from './validate-email';
export { generateNumberValidation } from './validate-number';
export { generatePhoneValidation } from './validate-phone';
