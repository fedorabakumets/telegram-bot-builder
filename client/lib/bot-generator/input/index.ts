/**
 * @fileoverview Экспорт модуля пользовательского ввода
 * Агрегирует функции для работы с вводом пользователя
 */

// Обработчики ввода
export {
  generateButtonResponseHandlersForInput,
  generateAdHocInputHandler
} from './generate-user-input-handlers';

// Валидация - главная функция
export { generateUserInputValidation } from './generate-validation';

// Валидация по типам (для переиспользования)
export { generateLengthValidation } from './validate-length';
export { generateMinLengthValidation, generateMaxLengthValidation } from './validate-length';
export { generateEmailValidation } from './validate-email';
export { generateNumberValidation } from './validate-number';
export { generatePhoneValidation } from './validate-phone';
