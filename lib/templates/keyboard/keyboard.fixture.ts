/**
 * @fileoverview Тестовые данные для шаблона клавиатуры
 * @module templates/keyboard/keyboard.fixture
 */

import type { KeyboardTemplateParams, ButtonWithShortId } from './keyboard.params';

/** Хелпер: создаёт кнопку с обязательными полями по умолчанию */
function btn(text: string, action: ButtonWithShortId['action'], opts: Partial<ButtonWithShortId> = {}): ButtonWithShortId {
  return {
    id: opts.id ?? `btn_${text.replace(/\s+/g, '_').toLowerCase().slice(0, 10)}`,
    text,
    action,
    buttonType: 'normal',
    skipDataCollection: false,
    hideAfterClick: false,
    ...opts,
  };
}

/** Валидные параметры: inline клавиатура */
export const validParamsInline: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    btn('📊 Статистика', 'goto', { target: 'btn_stats', id: 'btn_stats' }),
    btn('⚙️ Настройки', 'goto', { target: 'btn_settings', id: 'btn_settings' }),
    btn('🌐 Сайт', 'url', { target: 'https://example.com', id: 'btn_site', url: 'https://example.com' }),
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: reply клавиатура */
export const validParamsReply: KeyboardTemplateParams = {
  keyboardType: 'reply',
  buttons: [
    btn('📖 О боте', 'goto', { target: 'about', id: 'btn_about' }),
    btn('📞 Контакты', 'goto', { target: 'contacts', id: 'btn_contacts' }),
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: с раскладкой */
export const validParamsWithLayout: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    btn('Button 1', 'goto', { target: 'btn1', id: 'btn_1' }),
    btn('Button 2', 'goto', { target: 'btn2', id: 'btn_2' }),
    btn('Button 3', 'goto', { target: 'btn3', id: 'btn_3' }),
    btn('Button 4', 'goto', { target: 'btn4', id: 'btn_4' }),
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
    btn('Continue', 'goto', { target: 'continue', id: 'btn_continue' }),
  ],
  oneTimeKeyboard: true,
  resizeKeyboard: false,
};

/** Валидные параметры: множественный выбор inline */
export const validParamsMultiSelectInline: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    btn('Option 1', 'selection', { target: 'opt1', id: 'btn_opt1' }),
    btn('Option 2', 'selection', { target: 'opt2', id: 'btn_opt2' }),
    btn('Option 3', 'selection', { target: 'opt3', id: 'btn_opt3' }),
    btn('Готово', 'complete', { target: 'next_node', id: 'btn_done' }),
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
    btn('Option 1', 'selection', { target: 'opt1', id: 'btn_opt1' }),
    btn('Option 2', 'selection', { target: 'opt2', id: 'btn_opt2' }),
    btn('Готово', 'complete', { target: 'next_node', id: 'btn_done' }),
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
    btn('📱 Мой номер', 'contact', { requestContact: true, id: 'btn_contact' }),
    btn('📍 Моя геопозиция', 'location', { requestLocation: true, id: 'btn_location' }),
    btn('Пропустить', 'goto', { target: 'skip', id: 'btn_skip' }),
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: с parseMode HTML */
export const validParamsParseModeHtml: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    btn('Button', 'goto', { target: 'next', id: 'btn_next' }),
  ],
  parseMode: 'html',
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: с переменными в тексте */
export const validParamsWithVariables: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    btn('Привет, {user_name}!', 'goto', { target: 'next', id: 'btn_greet' }),
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: раскладка с пустыми buttonIds (проверка защиты от builder.adjust(, )) */
export const validParamsEmptyButtonIds: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    btn('Button 1', 'goto', { target: 'btn1', id: 'btn_1' }),
    btn('Button 2', 'goto', { target: 'btn2', id: 'btn_2' }),
  ],
  keyboardLayout: {
    rows: [
      { buttonIds: [] },
      { buttonIds: [] },
    ],
    columns: 1,
    autoLayout: false,
  },
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

/** Валидные параметры: copy_text кнопка (Bot API 7.11) */
export const validParamsCopyText: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    btn('📋 Скопировать промокод', 'copy_text', { id: 'btn_copy', copyText: 'PROMO2024' }),
    btn('Перейти', 'goto', { target: 'next_node', id: 'btn_next' }),
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: web_app кнопка (Telegram Mini App) */
export const validParamsWebApp: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    btn('🌐 Открыть магазин', 'web_app', { id: 'btn_webapp', webAppUrl: 'https://example.com/shop' }),
    btn('Перейти', 'goto', { target: 'next_node', id: 'btn_next' }),
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: кнопки со стилями (Bot API 9.4) */
export const validParamsWithStyle: KeyboardTemplateParams = {
  keyboardType: 'inline',
  buttons: [
    btn('Подтвердить', 'goto', { target: 'confirm', id: 'btn_confirm', style: 'primary' }),
    btn('Отмена', 'goto', { target: 'cancel', id: 'btn_cancel', style: 'secondary' }),
    btn('Удалить', 'goto', { target: 'delete', id: 'btn_delete', style: 'destructive' }),
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};

/** Валидные параметры: кнопка запроса управляемого бота (Bot API 9.6) */
export const validParamsRequestManagedBot: KeyboardTemplateParams = {
  keyboardType: 'reply',
  buttons: [
    btn('🤖 Создать бота', 'request_managed_bot', {
      id: 'btn_managed_bot',
      suggestedBotName: 'Мой бот',
      suggestedBotUsername: 'my_new_bot',
    }),
    btn('Пропустить', 'goto', { target: 'skip_node', id: 'btn_skip' }),
  ],
  oneTimeKeyboard: false,
  resizeKeyboard: true,
};
