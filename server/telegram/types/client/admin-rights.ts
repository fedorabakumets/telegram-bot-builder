/**
 * @fileoverview Права администратора чата
 * @module server/telegram/types/client/admin-rights
 */

/**
 * Права администратора в чате/канале
 */
export interface AdminRights {
  /** Изменение информации чата */
  can_change_info?: boolean;

  /** Публикация сообщений (для каналов) */
  can_post_messages?: boolean;

  /** Редактирование сообщений */
  can_edit_messages?: boolean;

  /** Удаление сообщений */
  can_delete_messages?: boolean;

  /** Блокировка участников */
  can_restrict_members?: boolean;

  /** Приглашение пользователей */
  can_invite_users?: boolean;

  /** Закрепление сообщений */
  can_pin_messages?: boolean;

  /** Назначение администраторов */
  can_promote_members?: boolean;

  /** Управление видеочатами */
  can_manage_video_chats?: boolean;

  /** Анонимность */
  can_be_anonymous?: boolean;

  /** Управление темами */
  can_manage_topics?: boolean;

  /** Публикация историй */
  can_post_stories?: boolean;

  /** Редактирование историй */
  can_edit_stories?: boolean;

  /** Удаление историй */
  can_delete_stories?: boolean;

  /** Пользовательское звание */
  custom_title?: string;
}
