/**
 * @fileoverview Тестовые данные для шаблона обработчика /start
 * @module templates/start/start.fixture
 */

import type { StartTemplateParams } from './start.params';

/** Валидные параметры: базовый start */
export const validParamsBasic: StartTemplateParams = {
  nodeId: 'start_1',
  messageText: '👋 Добро пожаловать в наш бот!\n\nВыберите раздел меню:',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [],
  allowMultipleSelection: false,
  multiSelectVariable: '',
  buttons: [],
  keyboardType: 'none',
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: false,
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с проверками безопасности */
export const validParamsWithChecks: StartTemplateParams = {
  nodeId: 'start_2',
  messageText: '🔒 Привет, администратор!',
  isPrivateOnly: true,
  adminOnly: true,
  requiresAuth: true,
  userDatabaseEnabled: true,
  synonyms: [],
  allowMultipleSelection: false,
  multiSelectVariable: '',
  buttons: [],
  keyboardType: 'none',
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: false,
  formatMode: 'html',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с множественным выбором */
export const validParamsWithMultipleSelection: StartTemplateParams = {
  nodeId: 'start_3',
  messageText: '📋 Выберите ваши интересы:',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: true,
  synonyms: [],
  allowMultipleSelection: true,
  multiSelectVariable: 'user_interests',
  buttons: [
    { text: '🏃 Спорт', action: 'selection', target: 'sport', id: 'btn_sport', buttonType: 'option' as const, skipDataCollection: false, hideAfterClick: false },
    { text: '🎵 Музыка', action: 'selection', target: 'music', id: 'btn_music', buttonType: 'option' as const, skipDataCollection: false, hideAfterClick: false },
    { text: '✈️ Путешествия', action: 'selection', target: 'travel', id: 'btn_travel', buttonType: 'option' as const, skipDataCollection: false, hideAfterClick: false },
    { text: '✅ Готово', action: 'complete', target: 'done', id: 'btn_done', buttonType: 'complete' as const, skipDataCollection: false, hideAfterClick: false },
  ],
  keyboardType: 'inline',
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: false,
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с автопереходом */
export const validParamsWithAutoTransition: StartTemplateParams = {
  nodeId: 'start_4',
  messageText: '🚀 Запускаю бота...',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: true,
  synonyms: [],
  allowMultipleSelection: false,
  multiSelectVariable: '',
  buttons: [],
  keyboardType: 'none',
  enableAutoTransition: true,
  autoTransitionTo: 'main_menu',
  collectUserInput: false,
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с синонимами */
export const validParamsWithSynonyms: StartTemplateParams = {
  nodeId: 'start_5',
  messageText: '👋 Привет! Рад вас видеть!',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: true,
  synonyms: ['привет', 'здравствуй', 'hello', 'hi'],
  allowMultipleSelection: false,
  multiSelectVariable: '',
  buttons: [
    { text: '📖 О боте', action: 'goto', target: 'about', id: 'btn_about', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
    { text: '📞 Контакты', action: 'goto', target: 'contacts', id: 'btn_contacts', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
  ],
  keyboardType: 'reply',
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: false,
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с клавиатурой inline */
export const validParamsWithInlineKeyboard: StartTemplateParams = {
  nodeId: 'start_6',
  messageText: '📋 Главное меню',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [],
  allowMultipleSelection: false,
  multiSelectVariable: '',
  buttons: [
    { text: '📊 Статистика', action: 'goto', target: 'stats', id: 'btn_stats', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
    { text: '⚙️ Настройки', action: 'goto', target: 'settings', id: 'btn_settings', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
    { text: '🌐 Сайт', action: 'url', target: 'https://example.com', id: 'btn_site', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
  ],
  keyboardType: 'inline',
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: false,
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Валидные параметры: с кнопкой "Назад в меню" (target="start") */
export const validParamsWithBackToMenuButton: StartTemplateParams = {
  nodeId: 'start_7',
  messageText: '🏠 Главное меню',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [],
  allowMultipleSelection: false,
  multiSelectVariable: '',
  buttons: [
    { text: '📊 Раздел', action: 'goto', target: 'section_1', id: 'btn_section', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
    { text: '⬅ Назад в меню', action: 'goto', target: 'start', id: 'btn_back', buttonType: 'normal' as const, skipDataCollection: false, hideAfterClick: false },
  ],
  keyboardType: 'inline',
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: false,
  formatMode: 'none',
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  nodeId: 123, // должно быть string
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  messageText: 'Привет!',
  // отсутствует nodeId
};

/** Ожидаемый вывод: базовый start */
export const expectedOutputBasic = `
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    """Обработчик команды /start"""
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")
`.trim();

/** Ожидаемый вывод: с проверками безопасности */
export const expectedOutputWithChecks = `
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    """Обработчик команды /start"""
    logging.info(f"Команда /start вызвана пользователем {message.from_user.id}")

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

/** Ожидаемый вывод: с множественным выбором */
export const expectedOutputWithMultipleSelection = `
# Инициализируем состояние множественного выбора
if user_id not in user_data:
    user_data[user_id] = {}
user_data[user_id]["multi_select"] = []
user_data[user_id]["multi_select_node"] = "start_3"
`.trim();
