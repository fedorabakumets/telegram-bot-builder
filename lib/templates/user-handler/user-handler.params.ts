/**
 * @fileoverview Параметры для шаблона обработчиков управления пользователями
 * @module templates/user-handler/user-handler.params
 */

export type UserHandlerNodeType =
  | 'ban_user'
  | 'unban_user'
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
  /** Длительность мута в секундах */
  duration?: number;
  /** Разрешить текст */
  canSendMessages?: boolean;
  /** Разрешить аудио */
  canSendAudios?: boolean;
  /** Разрешить документы */
  canSendDocuments?: boolean;
  /** Разрешить фото */
  canSendPhotos?: boolean;
  /** Разрешить видео */
  canSendVideos?: boolean;
  /** Разрешить видеозаметки */
  canSendVideoNotes?: boolean;
  /** Разрешить голосовые */
  canSendVoiceNotes?: boolean;
  /** Разрешить опросы */
  canSendPolls?: boolean;
  /** Разрешить стикеры и прочие сообщения */
  canSendOtherMessages?: boolean;
  /** Разрешить предпросмотр ссылок */
  canAddWebPagePreviews?: boolean;
  /** Разрешить реакции */
  canReactToMessages?: boolean;
  /** Разрешить менять описание группы */
  canChangeGroupInfo?: boolean;
  /** Разрешить приглашения */
  canInviteUsers2?: boolean;
  /** Разрешить закрепление */
  canPinMessages2?: boolean;

  // promote_user
  /** Менять описание группы */
  canChangeInfo?: boolean;
  /** Удалять сообщения */
  canDeleteMessages?: boolean;
  /** Приглашать пользователей */
  canInviteUsers?: boolean;
  /** Ограничивать участников */
  canRestrictMembers?: boolean;
  /** Закреплять сообщения */
  canPinMessages?: boolean;
  /** Назначать администраторов */
  canPromoteMembers?: boolean;
  /** Управлять видеочатами */
  canManageVideoChats?: boolean;
  /** Управлять темами */
  canManageTopics?: boolean;
  /** Анонимный администратор */
  isAnonymous?: boolean;
  /** Управлять чатом. В вызов попадает только если задано */
  canManageChat?: boolean;
  /** Публиковать сообщения. В вызов попадает только если задано */
  canPostMessages?: boolean;
  /** Редактировать сообщения. В вызов попадает только если задано */
  canEditMessages?: boolean;
  /** Управлять личными сообщениями. В вызов попадает только если задано */
  canManageDirectMessages?: boolean;
  /** Управлять тегами. В вызов попадает только если задано */
  canManageTags?: boolean;
  /** Отправлять приветствия. В вызов попадает только если задано */
  canSendWelcomeMessages?: boolean;
}
