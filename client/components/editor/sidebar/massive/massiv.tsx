import { ComponentDefinition } from "@shared/schema";
import { broadcastNode } from "../../canvas/canvas-node/broadcast-node";
import { clientAuthNode } from "../../canvas/canvas-node/client-auth-node";
import { startCommand, helpCommand, settingsCommand, menuCommand, customCommand } from "./commands";
import { textMessage, stickerMessage, voiceMessage, locationMessage, contactMessage } from "./messages";
import { banUser, unbanUser, muteUser, unmuteUser, kickUser, promoteUser, demoteUser } from "./user-management";

/**
 * Массив определений компонентов для конструктора бота
 * Содержит все доступные типы узлов с их настройками по умолчанию
 */
export const components: ComponentDefinition[] = [
  textMessage,
  stickerMessage,
  voiceMessage,
  locationMessage,
  contactMessage,
  startCommand,
  helpCommand,
  settingsCommand,
  menuCommand,
  customCommand,
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
  banUser,
  unbanUser,
  muteUser,
  unmuteUser,
  kickUser,
  promoteUser,
  demoteUser,
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