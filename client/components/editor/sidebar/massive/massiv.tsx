import { ComponentDefinition } from "@shared/schema";
import { broadcastNode } from "../../canvas/canvas-node/broadcast-node";
import { clientAuthNode } from "../../canvas/canvas-node/client-auth-node";

/**
 * Массив определений компонентов для конструктора бота
 * Содержит все доступные типы узлов с их настройками по умолчанию
 */
export const components: ComponentDefinition[] = [
  {
    id: 'text-message',
    name: 'Текстовое сообщение',
    description: 'Обычный текст или Markdown',
    icon: 'fas fa-comment',
    color: 'bg-blue-100 text-blue-600',
    type: 'message',
    defaultData: {
      messageText: 'Новое сообщение',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'sticker-message',
    name: 'Стикер',
    description: 'Анимированный стикер',
    icon: 'fas fa-laugh',
    color: 'bg-pink-100 text-pink-600',
    type: 'sticker',
    defaultData: {
      messageText: 'Стикер',
      stickerUrl: '',
      stickerFileId: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'voice-message',
    name: 'Голосовое сообщение',
    description: 'Голосовое сообщение',
    icon: 'fas fa-microphone',
    color: 'bg-teal-100 text-teal-600',
    type: 'voice',
    defaultData: {
      messageText: 'Голосовое сообщение',
      voiceUrl: '',
      duration: 0,
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'location-message',
    name: 'Геолокация',
    description: 'Отправка координат',
    icon: 'fas fa-map-marker',
    color: 'bg-green-100 text-green-600',
    type: 'location',
    defaultData: {
      messageText: 'Местоположение',
      latitude: 55.7558,
      longitude: 37.6176,
      title: 'Москва',
      address: 'Москва, Россия',
      foursquareId: '',
      foursquareType: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },
  {
    id: 'contact-message',
    name: 'Контакт',
    description: 'Поделиться контактом',
    icon: 'fas fa-address-book',
    color: 'bg-blue-100 text-blue-600',
    type: 'contact',
    defaultData: {
      messageText: 'Контакт',
      phoneNumber: '+7 (999) 123-45-67',
      firstName: 'Имя',
      lastName: 'Фамилия',
      userId: 0,
      vcard: '',
      keyboardType: 'none',
      buttons: [],
      markdown: false,
      oneTimeKeyboard: false,
      resizeKeyboard: true
    }
  },

  {
    id: 'start-command',
    name: '/start команда',
    description: 'Точка входа в бота',
    icon: 'fas fa-play',
    color: 'bg-green-100 text-green-600',
    type: 'start',
    defaultData: {
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
      adminOnly: false
    }
  },
  {
    id: 'help-command',
    name: '/help команда',
    description: 'Справка по боту',
    icon: 'fas fa-question-circle',
    color: 'bg-blue-100 text-blue-600',
    type: 'command',
    defaultData: {
      command: '/help',
      description: 'Справка по боту',
      messageText: '🤖 Доступные команды:\n\n/start - Начать работу\n/help - Эта справка\n/settings - Настройки',
      keyboardType: 'none',
      buttons: [],
      markdown: true,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    }
  },
  {
    id: 'settings-command',
    name: '/settings команда',
    description: 'Настройки бота',
    icon: 'fas fa-cog',
    color: 'bg-gray-100 text-gray-600',
    type: 'command',
    defaultData: {
      command: '/settings',
      description: 'Настройки бота',
      messageText: '⚙️ Настройки бота:',
      keyboardType: 'inline',
      buttons: [
        { id: 'btn-1', text: '📋 Язык', action: 'goto', buttonType: 'normal' as const, target: '/language' },
        { id: 'btn-2', text: '🔔 Уведомления', action: 'goto', buttonType: 'normal' as const, target: '/notifications' }
      ],
      markdown: true,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    }
  },
  {
    id: 'menu-command',
    name: '/menu команда',
    description: 'Главное меню',
    icon: 'fas fa-bars',
    color: 'bg-purple-100 text-purple-600',
    type: 'command',
    defaultData: {
      command: '/menu',
      description: 'Главное меню',
      messageText: '📋 Главное меню:',
      keyboardType: 'reply',
      buttons: [
        { id: 'btn-1', text: '📖 Информация', action: 'goto', buttonType: 'normal' as const, target: '/info' },
        { id: 'btn-2', text: '⚙️ Настройки', action: 'goto', buttonType: 'normal' as const, target: '/settings' },
        { id: 'btn-3', text: '❓ Помощь', action: 'goto', buttonType: 'normal' as const, target: '/help' },
        { id: 'btn-4', text: '📞 Поддержка', action: 'goto', buttonType: 'normal' as const, target: '/support' }
      ],
      markdown: true,
      oneTimeKeyboard: false,
      resizeKeyboard: true,
      showInMenu: true,
      isPrivateOnly: false,
      requiresAuth: false,
      adminOnly: false
    }
  },
  {
    id: 'custom-command',
    name: 'Пользовательская команда',
    description: 'Настраиваемая команда',
    icon: 'fas fa-terminal',
    color: 'bg-indigo-100 text-indigo-600',
    type: 'command',
    defaultData: {
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
      adminOnly: false
    }
  },
  {
    id: 'pin-message',
    name: 'Закрепить сообщение',
    description: 'Закрепление сообщения в группе',
    icon: 'fas fa-thumbtack',
    color: 'bg-cyan-100 text-cyan-600',
    type: 'pin_message',
    defaultData: {
      command: '/pin_message',
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: '',
      disableNotification: false
    }
  },
  {
    id: 'unpin-message',
    name: 'Открепить сообщение',
    description: 'Снятие закрепления сообщения',
    icon: 'fas fa-times',
    color: 'bg-slate-100 text-slate-600',
    type: 'unpin_message',
    defaultData: {
      command: '/unpin_message',
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: ''
    }
  },
  {
    id: 'delete-message',
    name: 'Удалить сообщение',
    description: 'Удаление сообщения в группе',
    icon: 'fas fa-trash',
    color: 'bg-red-100 text-red-600',
    type: 'delete_message',
    defaultData: {
      command: '/delete_message',
      targetMessageId: '',
      messageIdSource: 'last_message',
      variableName: ''
    }
  },
  {
    id: 'ban-user',
    name: 'Заблокировать пользователя',
    description: 'Забанить участника группы',
    icon: 'fas fa-ban',
    color: 'bg-red-100 text-red-600',
    type: 'ban_user',
    defaultData: {
      command: '/ban_user',
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: '',
      reason: 'Нарушение правил группы',
      untilDate: 0
    }
  },
  {
    id: 'unban-user',
    name: 'Разблокировать пользователя',
    description: 'Снять бан с участника группы',
    icon: 'fas fa-user-check',
    color: 'bg-green-100 text-green-600',
    type: 'unban_user',
    defaultData: {
      command: '/unban_user',
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    }
  },
  {
    id: 'mute-user',
    name: 'Заглушить пользователя',
    description: 'Ограничить права участника',
    icon: 'fas fa-volume-mute',
    color: 'bg-orange-100 text-orange-600',
    type: 'mute_user',
    defaultData: {
      command: '/mute_user',
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: '',
      duration: 3600,
      reason: 'Нарушение правил группы',
      canSendMessages: false,
      canSendMediaMessages: false,
      canSendPolls: false,
      canSendOtherMessages: false,
      canAddWebPagePreviews: false,
      canChangeGroupInfo: false,
      canInviteUsers2: false,
      canPinMessages2: false
    }
  },
  {
    id: 'unmute-user',
    name: 'Снять ограничения',
    description: 'Восстановить права участника',
    icon: 'fas fa-volume-up',
    color: 'bg-green-100 text-green-600',
    type: 'unmute_user',
    defaultData: {
      command: '/unmute_user',
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    }
  },
  {
    id: 'kick-user',
    name: 'Исключить пользователя',
    description: 'Удалить участника из группы',
    icon: 'fas fa-user-times',
    color: 'bg-red-100 text-red-600',
    type: 'kick_user',
    defaultData: {
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: '',
      reason: 'Нарушение правил группы'
    }
  },
  {
    id: 'promote-user',
    name: 'Назначить администратором',
    description: 'Дать права администратора',
    icon: 'fas fa-crown',
    color: 'bg-yellow-100 text-yellow-600',
    type: 'promote_user',
    defaultData: {
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: '',
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
      isAnonymous: false
    }
  },
  {
    id: 'demote-user',
    name: 'Снять с администратора',
    description: 'Убрать права администратора',
    icon: 'fas fa-user-minus',
    color: 'bg-gray-100 text-gray-600',
    type: 'demote_user',
    defaultData: {
      targetUserId: '',
      userIdSource: 'last_message',
      userVariableName: ''
    }
  },
  {
    id: 'admin-rights',
    name: 'Тг права',
    description: 'Панель редактирования прав администратора',
    icon: 'fas fa-user-cog',
    color: 'bg-purple-100 text-purple-600',
    type: 'admin_rights',
    defaultData: {
      command: '/admin_rights',
      description: 'Управление правами администратора',
      synonyms: ['права админа', 'изменить права', 'админ права', 'тг права', 'права'],
      adminUserIdSource: 'last_message',
      adminChatIdSource: 'current_chat',
      // Права администратора согласно Telegram Bot API
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
    }
  },
  broadcastNode,
  clientAuthNode
];