/**
 * @fileoverview Тестовые данные для шаблона клавиатуры
 * @module templates/keyboard/keyboard.fixture
 */

import type { KeyboardTemplateParams } from './keyboard.params';

/** Валидные параметры: inline клавиатура */
export const validParamsInline: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    { text: '📊 Статистика', action: 'callback', target: 'stats', id: 'btn_stats' },
    { text: '⚙️ Настройки', action: 'callback', target: 'settings', id: 'btn_settings' },
    { text: '🌐 Сайт', action: 'url', target: 'https://example.com', id: 'btn_site' },
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: reply клавиатура */
export const validParamsReply: KeyboardTemplateParams = {
  keyboardType: 'reply',
  buttons: [
    { text: '📖 О боте', action: 'callback', target: 'about', id: 'btn_about' },
    { text: '📞 Контакты', action: 'callback', target: 'contacts', id: 'btn_contacts' },
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: с раскладкой */
export const validParamsWithLayout: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    { text: 'Button 1', action: 'callback', target: 'btn1', id: 'btn_1' },
    { text: 'Button 2', action: 'callback', target: 'btn2', id: 'btn_2' },
    { text: 'Button 3', action: 'callback', target: 'btn3', id: 'btn_3' },
    { text: 'Button 4', action: 'callback', target: 'btn4', id: 'btn_4' },
  ],
  keyboardLayout: {
    rows: [
      { buttonIds: ['btn_1', 'btn_2'] },
      { buttonIds: ['btn_3', 'btn_4'] },
    ],
    columns: 2,
    autoLayout: false,
  },
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: пустая клавиатура */
export const validParamsEmpty: KeyboardTemplateParams = {
  keyboardType: 'none',
  buttons: [],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: с oneTimeKeyboard */
export const validParamsOneTime: KeyboardTemplateParams = {
  keyboardType: 'reply',
  buttons: [
    { text: 'Continue', action: 'callback', target: 'continue', id: 'btn_continue' },
  ],
  oneTimeKeyboard: true,
  resizeKeyboard: false,
};

/** Валидные параметры: множественный выбор inline */
export const validParamsMultiSelectInline: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    { text: 'Option 1', action: 'selection', target: 'opt1', id: 'btn_opt1' },
    { text: 'Option 2', action: 'selection', target: 'opt2', id: 'btn_opt2' },
    { text: 'Option 3', action: 'selection', target: 'opt3', id: 'btn_opt3' },
    { text: 'Готово', action: 'complete', target: 'next_node', id: 'btn_done' },
  ],
  allowMultipleSelection: true,
  multiSelectVariable: 'user_interests',
  nodeId: 'node_123',
  oneTimeKeyboard: false,
  resizeKeyboard: true,
  allNodeIds: ['node_123', 'next_node'],
};

/** Валидные параметры: множественный выбор reply */
export const validParamsMultiSelectReply: KeyboardTemplateParams = {
  keyboardType: 'reply',
  buttons: [
    { text: 'Option 1', action: 'selection', target: 'opt1', id: 'btn_opt1' },
    { text: 'Option 2', action: 'selection', target: 'opt2', id: 'btn_opt2' },
    { text: 'Готово', action: 'complete', target: 'next_node', id: 'btn_done' },
  ],
  allowMultipleSelection: true,
  multiSelectVariable: 'user_interests',
  nodeId: 'node_456',
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: с contact/location кнопками */
export const validParamsContactLocation: KeyboardTemplateParams = {
  keyboardType: 'reply',
  buttons: [
    { text: '📱 Мой номер', action: 'contact', requestContact: true, id: 'btn_contact' },
    { text: '📍 Моя геопозиция', action: 'location', requestLocation: true, id: 'btn_location' },
    { text: 'Пропустить', action: 'goto', target: 'skip', id: 'btn_skip' },
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: с parseMode HTML */
export const validParamsParseModeHtml: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    { text: 'Button', action: 'goto', target: 'next', id: 'btn_next' },
  ],
  parseMode: 'html',
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: с переменными в тексте */
export const validParamsWithVariables: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    { text: 'Привет, {user_name}!', action: 'goto', target: 'next', id: 'btn_greet' },
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  keyboardType: 'popup', // неправильный тип
  buttons: [],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  // отсутствует keyboardLayout - поле без default
  keyboardLayout: { invalid: true },
};

/** Ожидаемый вывод: inline клавиатура */
export const expectedOutputInline = `
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📊 Статистика", callback_data="btn_stats"))
    builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="btn_settings"))
    builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://example.com"))
    keyboard = builder.as_markup()
`.trim();

/** Ожидаемый вывод: reply клавиатура */
export const expectedOutputReply = `
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📖 О боте"))
    builder.add(KeyboardButton(text="📞 Контакты"))
    keyboard = builder.as_markup(
        resize_keyboard=True,
        one_time_keyboard=False
    )
`.trim();

/** Ожидаемый вывод: пустая клавиатура */
export const expectedOutputEmpty = '    keyboard = None';
