// Keyboard Module
// Модуль для генерации клавиатур и обработчиков кнопок в Telegram ботах
// После миграции на Jinja2: все генераторы используют шаблоны

// Экспорт утилит которые используются другими модулями
export * from './calculateOptimalColumns';
export * from './createKeyboardContext';
export * from './generateKeyboardLayoutCode';
export * from './getAdjustCode';

// Экспорт утилит фильтрации и проверки
export * from './filterInlineNodes';
export * from './hasInlineButtons';
export * from './hasMultiSelectNodes';
export * from './processInlineButtonNodes';
export * from './identifyNodesRequiringMultiSelectLogic';

// Jinja2 шаблоны для генерации клавиатур - прямой импорт из templates
// Экспортируем с теми же именами для обратной совместимости
export { 
  generateKeyboard as generateInlineKeyboardCode,
  generateKeyboard as generateReplyKeyboardCode,
  generateKeyboard,
} from '../../templates/keyboard';
export type { KeyboardTemplateParams } from '../../templates/keyboard';
