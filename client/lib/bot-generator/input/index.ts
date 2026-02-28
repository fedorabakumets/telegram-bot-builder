/**
 * @fileoverview Экспорт модуля пользовательского ввода
 * Агрегирует функции для работы с вводом пользователя
 */

// Обработчики ввода
export {
  generateButtonResponseHandlersForInput,
  generateUniversalUserInputHandler,
  generateAdHocInputHandler
} from './generate-user-input-handlers';

// Валидация
export {
  generateUserInputValidation,
  generateEmailValidation,
  generateNumberValidation,
  generatePhoneValidation
} from './generate-validation';
