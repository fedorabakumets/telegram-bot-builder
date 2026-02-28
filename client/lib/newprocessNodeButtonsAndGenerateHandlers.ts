/**
 * @fileoverview Обёртка для совместимости со старыми импортами
 * 
 * Этот файл существует для обратной совместимости.
 * Все функции перемещены в client/lib/bot-generator/node-handlers/
 * 
 * @deprecated Используйте импорт из bot-generator/node-handlers
 */

export {
  newprocessNodeButtonsAndGenerateHandlers,
  createProcessNodeButtonsFunction
} from './bot-generator/node-handlers';
