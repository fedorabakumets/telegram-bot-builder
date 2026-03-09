/**
 * @fileoverview Модуль навигации по узлам Telegram-бота
 *
 * Предоставляет функции для генерации Python-кода навигации между узлами графа бота.
 * Поддерживает обработку различных типов узлов: сообщения, команды, множественный выбор,
 * условные сообщения, автопереходы и сбор пользовательского ввода.
 *
 * @module node-navigation
 */

// Главная функция навигации
export { handleNodeNavigation, type Connection } from './handle-node-navigation';

// Обработчики различных типов узлов
export { handleMultipleSelectionNode } from './handle-multiple-selection';
export { handleCommandNode } from './handle-command-node';
export { handleMessageWithInputType } from './handle-message-input';
export { handleAutoTransition } from './handle-auto-transition';
export { handleKeyboardNavigation } from './handle-keyboard-navigation';
export { handleConditionalMessages } from './handle-conditional-messages';
export { handleInputCollection } from './handle-input-collection';

// Вспомогательные утилиты
export {
  generateNoNodesWarning,
  getNodeCondition,
  extractInputVariable,
  extractInputTarget,
  type NavigationContext
} from './utils/navigation-helpers';
