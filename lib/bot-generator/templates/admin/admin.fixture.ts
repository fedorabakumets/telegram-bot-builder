/**
 * @fileoverview Тестовые данные для шаблона административных действий
 * @module templates/admin/admin.fixture
 */

import type { AdminTemplateParams } from './admin.params';

/** Валидные параметры: закрепление сообщения */
export const validParamsPinMessage: AdminTemplateParams = {
  nodeId: 'admin_1',
  adminActionType: 'pin_message',
  targetMessageId: '123',
  messageIdSource: 'manual',
  targetUserId: '',
  userIdSource: 'last_message',
  untilDate: 0,
  reason: '',
  muteDuration: 0,
  adminTargetUserId: '',
  canManageChat: false,
  canDeleteMessages: false,
  canManageVideoChats: false,
  canRestrictMembers: false,
  canPromoteMembers: false,
  canChangeInfo: false,
  canInviteUsers: false,
  canPinMessages: false,
  canManageTopics: false,
  isAnonymous: false,
  disableNotification: true,
  synonyms: [],
};

/** Валидные параметры: бан пользователя */
export const validParamsBanUser: AdminTemplateParams = {
  nodeId: 'admin_2',
  adminActionType: 'ban_user',
  targetMessageId: '',
  messageIdSource: 'last_message',
  targetUserId: '456',
  userIdSource: 'manual',
  untilDate: 1735689600,
  reason: 'Нарушение правил',
  muteDuration: 0,
  adminTargetUserId: '',
  canManageChat: false,
  canDeleteMessages: false,
  canManageVideoChats: false,
  canRestrictMembers: false,
  canPromoteMembers: false,
  canChangeInfo: false,
  canInviteUsers: false,
  canPinMessages: false,
  canManageTopics: false,
  isAnonymous: false,
  disableNotification: false,
  synonyms: [],
};

/** Валидные параметры: мут пользователя */
export const validParamsMuteUser: AdminTemplateParams = {
  nodeId: 'admin_3',
  adminActionType: 'mute_user',
  targetMessageId: '',
  messageIdSource: 'last_message',
  targetUserId: '789',
  userIdSource: 'last_message',
  untilDate: 0,
  reason: '',
  muteDuration: 3600,
  adminTargetUserId: '',
  canManageChat: false,
  canDeleteMessages: false,
  canManageVideoChats: false,
  canRestrictMembers: false,
  canPromoteMembers: false,
  canChangeInfo: false,
  canInviteUsers: false,
  canPinMessages: false,
  canManageTopics: false,
  isAnonymous: false,
  disableNotification: false,
  synonyms: [],
};

/** Валидные параметры: продвижение пользователя */
export const validParamsPromoteUser: AdminTemplateParams = {
  nodeId: 'admin_4',
  adminActionType: 'promote_user',
  targetMessageId: '',
  messageIdSource: 'last_message',
  targetUserId: '',
  userIdSource: 'last_message',
  untilDate: 0,
  reason: '',
  muteDuration: 0,
  adminTargetUserId: '111',
  canManageChat: true,
  canDeleteMessages: true,
  canManageVideoChats: false,
  canRestrictMembers: true,
  canPromoteMembers: false,
  canChangeInfo: true,
  canInviteUsers: true,
  canPinMessages: true,
  canManageTopics: false,
  isAnonymous: false,
  disableNotification: false,
  synonyms: [],
};

/** Валидные параметры: удаление сообщения */
export const validParamsDeleteMessage: AdminTemplateParams = {
  nodeId: 'admin_5',
  adminActionType: 'delete_message',
  targetMessageId: '999',
  messageIdSource: 'manual',
  targetUserId: '',
  userIdSource: 'last_message',
  untilDate: 0,
  reason: '',
  muteDuration: 0,
  adminTargetUserId: '',
  canManageChat: false,
  canDeleteMessages: false,
  canManageVideoChats: false,
  canRestrictMembers: false,
  canPromoteMembers: false,
  canChangeInfo: false,
  canInviteUsers: false,
  canPinMessages: false,
  canManageTopics: false,
  isAnonymous: false,
  disableNotification: false,
  synonyms: [],
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  nodeId: 123, // должно быть string
};

/** Невалидные параметры: отсутствует поле */
export const invalidParamsMissingField = {
  adminActionType: 'ban_user',
  // отсутствует nodeId
};

/** Ожидаемый вывод: закрепление сообщения */
export const expectedOutputPinMessage = `
@dp.message(Command("admin_pin_message_admin_1"))
async def handle_admin_pin_message_admin_1(message: types.Message):
    """Обработчик административного действия pin_message для узла admin_1"""
    user_id = message.from_user.id

    {# Проверка прав администратора #}
    chat_member = await bot.get_chat_member(chat_id=message.chat.id, user_id=user_id)
    if chat_member.status not in ['creator', 'administrator']:
        await message.answer("❌ Требуется права администратора")
        return

    {# Действия с сообщениями #}
    target_message_id = 123

    try:
        await bot.pin_chat_message(
            chat_id=message.chat.id,
            message_id=target_message_id
            , disable_notification=True
        )
        await message.answer(f"✅ Сообщение закреплено (ID: {target_message_id})")
    except Exception as e:
        logging.error(f"Ошибка закрепления сообщения: {e}")
        await message.answer("❌ Ошибка при закреплении сообщения")
`.trim();

/** Ожидаемый вывод: бан пользователя */
export const expectedOutputBanUser = `
@dp.message(Command("admin_ban_user_admin_2"))
async def handle_admin_ban_user_admin_2(message: types.Message):
    """Обработчик административного действия ban_user для узла admin_2"""
    user_id = message.from_user.id

    {# Проверка прав администратора #}
    chat_member = await bot.get_chat_member(chat_id=message.chat.id, user_id=user_id)
    if chat_member.status not in ['creator', 'administrator']:
        await message.answer("❌ Требуется права администратора")
        return

    {# Действия с пользователями #}
    target_user_id = 456

    if target_user_id == 0:
        await message.answer("❌ Не указан целевой пользователь")
        return

    try:
        until_date = 1735689600
        await bot.ban_chat_member(
            chat_id=message.chat.id,
            user_id=target_user_id,
            until_date=until_date
        )
        await message.answer(f"✅ Пользователь заблокирован до {until_date}")
    except Exception as e:
        logging.error(f"Ошибка блокировки пользователя: {e}")
        await message.answer("❌ Ошибка при блокировке пользователя")
`.trim();
