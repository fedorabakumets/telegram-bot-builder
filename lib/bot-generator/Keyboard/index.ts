// Keyboard Module
// Модуль для генерации клавиатур и обработчиков кнопок в Telegram ботах
// После миграции на Jinja2: основные генераторы клавиатур используют шаблоны

// Экспорт утилит которые используются другими модулями
export * from './calculateOptimalColumns';
export * from './createKeyboardContext';
export * from './generateKeyboardLayoutCode';
export * from './getAdjustCode';

// Экспорт специализированных обработчиков (не дублируют Jinja2)
export * from './generate-reply-button-handlers';
export * from './generate-transition-logic-multi-select';
export * from './generateMultiSelectButtonHandlerWithVariableSaving';

// Экспорт утилит фильтрации и проверки
export * from './filterInlineNodes';
export * from './hasInlineButtons';
export * from './hasMultiSelectNodes';
export * from './processInlineButtonNodes';
export * from './identifyNodesRequiringMultiSelectLogic';

// Адаптеры для обратной совместимости - используют Jinja2 шаблоны
// Переопределяют оригинальные функции для использования Jinja2
export { generateInlineKeyboardCodeAdapter as generateInlineKeyboardCode } from './generateInlineKeyboardCode.adapter';
export { generateReplyKeyboardCodeAdapter as generateReplyKeyboardCode } from './generateReplyKeyboardCode.adapter';
export { generateKeyboardAdapter as generateKeyboard } from './generateKeyboard.adapter';
export { generateKeyboardOnlyAdapter as generateKeyboardOnly } from './generateKeyboardOnly.adapter';

// Адаптеры обработчиков событий - используют Jinja2 шаблоны
export {
  generateMultiSelectCallbackLogicAdapter as generateMultiSelectCallbackLogic,
} from './generateMultiSelectCallbackLogic.adapter';
export {
  generateMultiSelectDoneHandlerAdapter as generateMultiSelectDoneHandler,
} from './generateMultiSelectDoneHandler.adapter';
export {
  generateMultiSelectReplyHandlerAdapter as generateMultiSelectReplyHandler,
} from './generateMultiSelectReplyHandler.adapter';
export {
  generateButtonResponseHandlersAdapter as generateButtonResponseHandlers,
} from './generateButtonResponseHandlers.adapter';