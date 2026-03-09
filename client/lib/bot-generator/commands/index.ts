/**
 * @fileoverview Экспорт модуля команд
 * Агрегирует функции для работы с командами бота
 */

// Сбор командных кнопок
export { collectAllCommandCallbacksFromNodes } from './collect-command-callbacks';

// Генерация обработчиков
export {
  generateCommandCallbackHandler,
  generateCommandTrigger,
  findCommandNode
} from './generate-command-handlers';

// Добавление обработчиков в код
export { addCommandCallbackHandlers } from './add-command-handlers';
