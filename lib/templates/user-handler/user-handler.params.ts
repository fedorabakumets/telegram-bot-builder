/**
 * @fileoverview Параметры для шаблона обработчиков управления пользователями
 * @module templates/user-handler/user-handler.params
 */

export type UserHandlerNodeType =
  | 'ban_user'
  | 'unban_user'
  | 'kick_user'
  | 'mute_user'
  | 'unmute_user'
  | 'promote_user'
  | 'demote_user';

export interface UserHandlerTemplateParams {
  nodeType: UserHandlerNodeType;
  nodeId: string;
  /** Безопасное имя функции (safe_name от nodeId) */
  safeName: string;
  /** Список синонимов-триггеров */
  synonyms: string[];
  /** ID конкретной группы, или '' для всех групп */
  targetGroupId?: string;

  // ban_user / kick_user
  reason?: string;
  /** Unix timestamp окончания бана (0 = навсегда) */
  untilDate?: number;

  // mute_user
  duration?: number;
  canSendMessages?: boolean;
  canSendMediaMessages?: boolean;
  canSendPolls?: boolean;
  canSendOtherMessages?: boolean;
  canAddWebPagePreviews?: boolean;
  canChangeGroupInfo?: boolean;
  canInviteUsers2?: boolean;
  canPinMessages2?: boolean;

  // promote_user
  canChangeInfo?: boolean;
  canDeleteMessages?: boolean;
  canInviteUsers?: boolean;
  canRestrictMembers?: boolean;
  canPinMessages?: boolean;
  canPromoteMembers?: boolean;
  canManageVideoChats?: boolean;
  canManageTopics?: boolean;
  isAnonymous?: boolean;
}
