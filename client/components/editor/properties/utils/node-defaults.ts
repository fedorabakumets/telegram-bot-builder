/**
 * @fileoverview Данные по умолчанию для узлов бота
 * Для инициализации новых узлов в Telegram Bot Builder.
 * @module node-defaults
 */

import { Node } from '@shared/schema';

/**
 * Получает данные по умолчанию для типа узла.
 * @param {Node['type']} type - Тип узла
 * @returns {any} Объект с данными по умолчанию
 */
export function getNodeDefaults(type: Node['type']): any {
  const defaults: Record<Node['type'], any> = {
    message: {
      messageText: 'Новое сообщение',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    sticker: {
      stickerUrl: '',
      stickerFileId: '',
      messageText: 'Стикер',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    voice: {
      voiceUrl: '',
      duration: 0,
      messageText: 'Голосовое сообщение',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    animation: {
      animationUrl: '',
      duration: 0,
      width: 0,
      height: 0,
      mediaCaption: '',
      messageText: 'Анимация',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    location: {
      latitude: 55.7558,
      longitude: 37.6176,
      title: 'Москва',
      address: 'Москва, Россия',
      foursquareId: '',
      foursquareType: '',
      messageText: 'Местоположение',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    contact: {
      phoneNumber: '+7 (999) 123-45-67',
      firstName: 'Имя',
      lastName: 'Фамилия',
      userId: 0,
      vcard: '',
      messageText: 'Контакт',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    },
    start: {
      command: '/start',
      description: 'Запустить бота',
      messageText: 'Привет! Добро пожаловать!',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false,
      synonyms: []
    },
    command: {
      command: '/custom',
      description: 'Новая команда',
      messageText: 'Команда выполнена',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false,
      synonyms: []
    },
    command_trigger: {
      command: '/start',
      description: '',
      autoTransitionTo: '',
      showInMenu: false,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    },
    text_trigger: {
      textSynonyms: [],
      textMatchType: 'exact',
      autoTransitionTo: '',
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    },
    pin_message: {
      command: '/pin_message',
      synonyms: ['закрепить', 'прикрепить', 'зафиксировать'],
      disableNotification: false,
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: ''
    },
    unpin_message: {
      command: '/unpin_message',
      synonyms: ['открепить', 'отцепить', 'убрать закрепление'],
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: ''
    },
    delete_message: {
      command: '/delete_message',
      synonyms: ['удалить', 'стереть', 'убрать сообщение'],
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: ''
    },
    forward_message: {
      command: '',
      synonyms: [],
      sourceMessageId: '',
      sourceMessageIdSource: 'current_message',
      sourceMessageNodeId: '',
      sourceMessageVariableName: '',
      targetChatId: '',
      targetChatIdSource: 'manual',
      targetChatVariableName: '',
      targetChatTargets: [],
      disableNotification: false
    },
    ban_user: {
      command: '/ban_user',
      synonyms: ['забанить', 'заблокировать', 'бан'],
      reason: 'Нарушение правил группы',
      untilDate: 0,
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    unban_user: {
      command: '/unban_user',
      synonyms: ['разбанить', 'разблокировать', 'unbан'],
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    mute_user: {
      command: '/mute_user',
      synonyms: ['замутить', 'заглушить', 'мут'],
      reason: 'Нарушение правил группы',
      duration: 3600,
      canSendMessages: false,
      canSendMediaMessages: false,
      canSendPolls: false,
      canSendOtherMessages: false,
      canAddWebPagePreviews: false,
      canChangeGroupInfo: false,
      canInviteUsers2: false,
      canPinMessages2: false,
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    unmute_user: {
      command: '/unmute_user',
      synonyms: ['размутить', 'разглушить', 'анмут'],
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    kick_user: {
      command: '/kick_user',
      synonyms: ['кикнуть', 'исключить', 'выгнать'],
      reason: 'Нарушение правил группы',
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    promote_user: {
      command: '/promote_user',
      synonyms: ['повысить', 'назначить админом', 'промоут'],
      canChangeInfo: false,
      canDeleteMessages: true,
      canBanUsers: false,
      canInviteUsers: true,
      canPinMessages: true,
      canAddAdmins: false,
      canRestrictMembers: false,
      canPromoteMembers: false,
      canManageVideoChats: false,
      canManageTopics: false,
      isAnonymous: false,
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    demote_user: {
      command: '/demote_user',
      synonyms: ['понизить', 'снять с админки', 'демоут'],
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    },
    admin_rights: {
      command: '/admin_rights',
      description: 'Управление правами администратора',
      synonyms: ['права админа', 'изменить права', 'админ права', 'тг права', 'права'],
      adminUserIdSource: 'last_message',
      adminChatIdSource: 'current_chat',
      keyboardType: 'inline',
      buttons: [
        { id: 'perm_change_info', text: '🏷️ Изменение профиля', action: 'command', target: 'toggle_change_info', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_delete_messages', text: '🗑️ Удаление сообщений', action: 'command', target: 'toggle_delete_messages', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_restrict_members', text: '🚫 Блокировка участников', action: 'command', target: 'toggle_restrict_members', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_invite_users', text: '📨 Приглашение участников', action: 'command', target: 'toggle_invite_users', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_pin_messages', text: '📌 Закрепление сообщений', action: 'command', target: 'toggle_pin_messages', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_manage_video_chats', text: '🎥 Управление видеочатами', action: 'command', target: 'toggle_manage_video_chats', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_anonymous', text: '🔒 Анонимность', action: 'command', target: 'toggle_anonymous', skipDataCollection: false, hideAfterClick: false },
        { id: 'perm_promote_members', text: '👑 Назначение администраторов', action: 'command', target: 'toggle_promote_members', skipDataCollection: false, hideAfterClick: false }
      ],
      can_manage_chat: false,
      can_post_messages: false,
      can_edit_messages: false,
      can_delete_messages: true,
      can_post_stories: false,
      can_edit_stories: false,
      can_delete_stories: false,
      can_manage_video_chats: false,
      can_restrict_members: false,
      can_promote_members: false,
      can_change_info: false,
      can_invite_users: true,
      can_pin_messages: true,
      can_manage_topics: false,
      is_anonymous: false
    },
    broadcast: {
      idSourceType: 'bot_users',
      enableConfirmation: true,
      confirmationText: 'Отправить рассылку всем пользователям?',
      successMessage: '✅ Рассылка отправлена!',
      errorMessage: '❌ Ошибка рассылки'
    },
    photo: {
      messageText: '',
      keyboardType: 'none',
      buttons: []
    },
    video: {
      messageText: '',
      keyboardType: 'none',
      buttons: []
    },
    audio: {
      messageText: '',
      keyboardType: 'none',
      buttons: []
    },
    document: {
      messageText: '',
      keyboardType: 'none',
      buttons: []
    },
    keyboard: {
      keyboardType: 'inline',
      buttons: []
    },
    input: {
      inputType: 'any',
      inputVariable: '',
      inputTargetNodeId: '',
      appendVariable: false,
      saveToDatabase: false,
      inputPrompt: 'Введите ответ',
      inputRequired: true
    },
    condition: {
      enableConditionalMessages: true,
      conditionalMessages: []
    },
    client_auth: {
      sessionName: 'user_session',
      sessionCreated: false
    },
    media: {
      mediaMode: 'single',
      mediaItems: [],
      attachedMedia: [],
      enableAutoTransition: false,
      autoTransitionTo: ''
    },
    managed_bot_updated_trigger: {
      saveBotIdTo: 'bot_id',
      saveBotUsernameTo: 'bot_username',
      saveBotNameTo: 'bot_name',
      saveCreatorIdTo: 'creator_id',
      saveCreatorUsernameTo: 'creator_username',
      filterByUserId: '',
      autoTransitionTo: '',
    },
  };
  return defaults[type] || {};
}
