/**
 * @fileoverview Утилита для создания прав администратора
 * @module server/telegram/utils/client/admin-rights-builder
 */

import { Api } from 'telegram/tl';
import type { AdminRights } from '../../types/client/admin-rights.js';

/**
 * Создаёт объект ChatAdminRights для назначения администратором
 * @param rights - Права администратора
 * @returns Объект ChatAdminRights для API вызова
 */
export function createAdminRights(rights: AdminRights): Api.ChatAdminRights {
  return new Api.ChatAdminRights({
    changeInfo: rights.can_change_info ?? false,
    postMessages: rights.can_post_messages ?? false,
    editMessages: rights.can_edit_messages ?? false,
    deleteMessages: rights.can_delete_messages ?? false,
    banUsers: rights.can_restrict_members ?? false,
    inviteUsers: rights.can_invite_users ?? false,
    pinMessages: rights.can_pin_messages ?? false,
    addAdmins: rights.can_promote_members ?? false,
    manageCall: rights.can_manage_video_chats ?? false,
    anonymous: rights.can_be_anonymous ?? false,
    manageTopics: rights.can_manage_topics ?? false,
    postStories: rights.can_post_stories ?? false,
    editStories: rights.can_edit_stories ?? false,
    deleteStories: rights.can_delete_stories ?? false,
  });
}
