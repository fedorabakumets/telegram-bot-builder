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
