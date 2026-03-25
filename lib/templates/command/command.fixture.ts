/**
 * @fileoverview Тестовые данные для шаблона обработчика команд
 * @module templates/command/command.fixture
 */

import type { CommandTemplateParams } from './command.params';

/** Валидные параметры: базовая команда */
export const validParamsBasic: CommandTemplateParams = {
  nodeId: 'cmd_1',
  command: '/help',
  messageText: '🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка',
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [],
  enableConditionalMessages: false,
  conditionalMessages: [],
  fallbackMessage: '',
  keyboardType: 'none',
  buttons: [],
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с проверками безопасности */
export const validParamsWithChecks: CommandTemplateParams = {
  nodeId: 'cmd_2',
  command: '/admin',
  messageText: '🔒 Панель администратора',
  adminOnly: true,
  requiresAuth: true,
  userDatabaseEnabled: true,
  synonyms: [],
  enableConditionalMessages: false,
  conditionalMessages: [],
  fallbackMessage: '',
  keyboardType: 'none',
  buttons: [],
  formatMode: 'html',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с условными сообщениями */
export const validParamsWithConditionals: CommandTemplateParams = {
  nodeId: 'cmd_3',
  command: '/profile',
  messageText: '👤 Ваш профиль',
  adminOnly: false,
  requiresAuth: true,
  userDatabaseEnabled: true,
  synonyms: [],
  enableConditionalMessages: true,
  conditionalMessages: [
    {
      condition: 'user_data_exists',
      variableName: 'balance',
      priority: 1,
      buttons: [
        { text: 'Пополнить', action: 'goto', target: 'deposit', id: 'btn_deposit' },
        { text: 'Вывести', action: 'goto', target: 'withdraw', id: 'btn_withdraw' },
      ],
      collectUserInput: false,
    },
    {
      condition: 'user_data_exists',
      variableName: 'name',
      priority: 2,
      buttons: [],
      collectUserInput: false,
    },
  ],
  fallbackMessage: '📝 Профиль не найден',
  keyboardType: 'none',
  buttons: [],
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с клавиатурой */
export const validParamsWithKeyboard: CommandTemplateParams = {
  nodeId: 'cmd_4',
  command: '/menu',
  messageText: '📋 Главное меню',
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [],
  enableConditionalMessages: false,
  conditionalMessages: [],
  fallbackMessage: '',
  keyboardType: 'inline',
  buttons: [
    { text: '📊 Статистика', action: 'goto', target: 'stats', id: 'btn_stats', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
    { text: '⚙️ Настройки', action: 'goto', target: 'settings', id: 'btn_settings', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
    { text: '🌐 Сайт', action: 'url', target: 'https://example.com', id: 'btn_site', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
  ],
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с синонимами */
export const validParamsWithSynonyms: CommandTemplateParams = {
  nodeId: 'cmd_5',
  command: '/start',
  messageText: '👋 Добро пожаловать!',
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: true,
  synonyms: ['привет', 'здравствуй', 'hello'],
  enableConditionalMessages: false,
  conditionalMessages: [],
  fallbackMessage: '',
  keyboardType: 'reply',
  buttons: [
    { text: '📖 О боте', action: 'goto', target: 'about', id: 'btn_about', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
    { text: '📞 Контакты', action: 'goto', target: 'contacts', id: 'btn_contacts', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
  ],
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с автопереходом */
export const validParamsWithAutoTransition: CommandTemplateParams = {
  nodeId: 'cmd_6',
  command: '/next',
  messageText: 'Переходим дальше...',
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: true,
  synonyms: [],
  enableConditionalMessages: false,
  conditionalMessages: [],
  fallbackMessage: '',
  keyboardType: 'none',
  buttons: [],
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
  enableAutoTransition: true,
  autoTransitionTo: 'after_cmd',
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  nodeId: 123, // должно быть string
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  command: '/help',
  // отсутствует nodeId
};

/** Ожидаемый вывод: базовая команда */
export const expectedOutputBasic = `
@dp.message(Command("help"))
async def help_handler(message: types.Message):
    """Обработчик команды /help"""
    logging.info(f"Команда /help вызвана пользователем {message.from_user.id}")
`.trim();

/** Ожидаемый вывод: с проверками безопасности */
export const expectedOutputWithChecks = `
@dp.message(Command("admin"))
async def admin_handler(message: types.Message):
    """Обработчик команды /admin"""
    logging.info(f"Команда /admin вызвана пользователем {message.from_user.id}")

    if not await is_private_chat(message):
        await message.answer("❌ Эта команда доступна только в приватных чатах")
        return

    if not await is_admin(message.from_user.id):
        await message.answer("❌ У вас нет прав для выполнения этой команды")
        return

    if not await check_auth(message.from_user.id):
        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")
        return
`.trim();

/** Ожидаемый вывод: с клавиатурой */
export const expectedOutputWithKeyboard = `
builder = InlineKeyboardBuilder()
builder.add(InlineKeyboardButton(text="📊 Статистика", callback_data="btn_stats"))
builder.add(InlineKeyboardButton(text="⚙️ Настройки", callback_data="btn_settings"))
builder.add(InlineKeyboardButton(text="🌐 Сайт", url="https://example.com"))
keyboard = builder.as_markup()
`.trim();
