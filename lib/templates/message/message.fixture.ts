/**
 * @fileoverview Тестовые данные для шаблона сообщения
 * @module templates/message/message.fixture
 */

import type { MessageTemplateParams } from './message.params';

/** Валидные параметры: базовое сообщение */
export const validParamsBasic: MessageTemplateParams = {
  nodeId: 'msg_123',
  messageText: 'Привет! Выберите опцию:',
  keyboardType: 'inline',
  buttons: [
    { text: 'Опция 1', action: 'goto', target: 'option_1', id: 'btn_1' },
    { text: 'Опция 2', action: 'goto', target: 'option_2', id: 'btn_2' },
  ],
};

/** Валидные параметры: с автопереходом */
export const validParamsWithAutoTransition: MessageTemplateParams = {
  nodeId: 'loading',
  messageText: 'Загрузка...',
  enableAutoTransition: true,
  autoTransitionTo: 'next_step',
};

/** Валидные параметры: с медиа */
export const validParamsWithMedia: MessageTemplateParams = {
  nodeId: 'photo_node',
  messageText: 'Вот ваше фото:',
  imageUrl: 'https://example.com/image.jpg',
  keyboardType: 'inline',
  buttons: [
    { text: '👍 Нравится', action: 'goto', target: 'like', id: 'btn_like' },
  ],
};

/** Валидные параметры: с проверками безопасности */
export const validParamsWithSecurity: MessageTemplateParams = {
  nodeId: 'admin_panel',
  messageText: 'Панель администратора',
  adminOnly: true,
  isPrivateOnly: true,
  requiresAuth: true,
  keyboardType: 'inline',
  buttons: [
    { text: 'Пользователи', action: 'goto', target: 'users', id: 'btn_users' },
  ],
};

/** Валидные параметры: reply клавиатура */
export const validParamsReply: MessageTemplateParams = {
  nodeId: 'menu',
  messageText: 'Главное меню',
  keyboardType: 'reply',
  buttons: [
    { text: 'Профиль', action: 'goto', target: 'profile', id: 'btn_profile' },
    { text: 'Настройки', action: 'goto', target: 'settings', id: 'btn_settings' },
  ],
  resizeKeyboard: true,
  oneTimeKeyboard: false,
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  nodeId: 123, // должно быть string
  messageText: 'Привет',
};

/** Невалидные параметры: отсутствует nodeId */
export const invalidParamsMissingNodeId = {
  messageText: 'Привет',
  // отсутствует nodeId
};

/** Валидные параметры: с получателями (messageSendRecipients) */
export const validParamsWithRecipients: MessageTemplateParams = {
  nodeId: 'msg_notify',
  messageText: 'Уведомление',
  messageSendRecipients: [
    { id: 'r1', type: 'user' },
    { id: 'r2', type: 'chat_id', chatId: '123456789' },
    { id: 'r3', type: 'chat_id', chatId: '{admin_chat}', threadId: '{thread_id}' },
  ],
};

/** Ожидаемый вывод: базовое сообщение */
export const expectedOutputBasic = `
@dp.callback_query(lambda c: c.data == "msg_123" or c.data.startswith("msg_123_btn_"))
async def handle_callback_msg_123(callback_query: types.CallbackQuery, state: FSMContext = None):
    """Обработчик перехода к узлу msg_123"""
    user_id = callback_query.from_user.id
    logging.info(f"🔵 Переход к узлу msg_123 для пользователя {user_id}")
`.trim();
