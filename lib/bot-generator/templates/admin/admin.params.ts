/**
 * @fileoverview Параметры для шаблона административных действий
 * @module templates/admin/admin.params
 */

/** Типы административных действий */
export type AdminActionType =
  | 'pin_message'
  | 'unpin_message'
  | 'delete_message'
  | 'ban_user'
  | 'unban_user'
  | 'mute_user'
  | 'unmute_user'
  | 'kick_user'
  | 'promote_user'
  | 'demote_user';

/** Параметры для генерации обработчика административного действия */
export interface AdminTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Тип административного действия */
  adminActionType: AdminActionType;
  /** ID целевого сообщения */
  targetMessageId: string;
  /** Источник ID сообщения: 'manual', 'variable', 'last_message' */
  messageIdSource: 'manual' | 'variable' | 'last_message';
  /** ID целевого пользователя */
  targetUserId: string;
  /** Источник ID пользователя: 'manual', 'variable', 'last_message' */
  userIdSource: 'manual' | 'variable' | 'last_message';
  /** Дата окончания ограничения (timestamp) */
  untilDate: number;
  /** Причина действия */
  reason: string;
  /** Длительность мута в секундах */
  muteDuration: number;
  /** ID пользователя для продвижения/понижения */
  adminTargetUserId: string;
  /** Право управления чатом */
  canManageChat: boolean;
  /** Право удаления сообщений */
  canDeleteMessages: boolean;
  /** Право управления видеочатами */
  canManageVideoChats: boolean;
  /** Право ограничения участников */
  canRestrictMembers: boolean;
  /** Право продвижения участников */
  canPromoteMembers: boolean;
  /** Право изменения информации */
  canChangeInfo: boolean;
  /** Право приглашения пользователей */
  canInviteUsers: boolean;
  /** Право закрепления сообщений */
  canPinMessages: boolean;
  /** Право управления темами */
  canManageTopics: boolean;
  /** Анонимный администратор */
  isAnonymous: boolean;
  /** Отправить без уведомления (для pin) */
  disableNotification: boolean;
  /** Синонимы команды */
  synonyms: string[];
}
