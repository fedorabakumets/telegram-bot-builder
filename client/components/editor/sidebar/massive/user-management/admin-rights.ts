/**
 * @fileoverview Определение компонента прав администратора
 * Панель редактирования прав администратора
 */
import { ComponentDefinition } from "@shared/schema";

/** Управление правами администратора Telegram */
export const adminRights: ComponentDefinition = {
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
};
