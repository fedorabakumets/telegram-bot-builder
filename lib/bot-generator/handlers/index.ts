/**
 * @fileoverview Экспорт модуля обработчиков
 * Агрегирует функции для работы с обработчиками бота
 */

// Обработчики групп
export { generateGroupBasedEventHandlers } from './generate-group-handlers';

// Fallback обработчики
export {
  generateFallbackHandlers,
  generateFallbackTextHandler,
  generateUnhandledPhotoHandler
} from './generate-fallback-handlers';

// Polling и сигналы
export {
  generateBotInitialization,
  generateSignalHandler,
  generatePollingLoop
} from './generate-polling-handlers';
