/**
 * @fileoverview Параметры для шаблона обработчиков синонимов
 * @module templates/synonyms/synonyms.params
 */

/** Тип узла для синонима */
export type SynonymNodeType =
  | 'start'
  | 'command'
  | 'message'
  | 'pin_message'
  | 'unpin_message'
  | 'delete_message'
  | 'ban_user'
  | 'unban_user'
  | 'mute_user'
  | 'unmute_user'
  | 'kick_user'
  | 'promote_user'
  | 'demote_user'
  | 'admin_rights';

/** Один синоним с метаданными узла */
export interface SynonymEntry {
  // --- Основные ---
  /** Текст синонима */
  synonym: string;
  /** ID узла */
  nodeId: string;
  /** Тип узла */
  nodeType: SynonymNodeType;

  // --- Для command/start ---
  /** Имя функции */
  functionName?: string;
  /** Оригинальная команда */
  originalCommand?: string;

  // --- Для content management (pin/unpin/delete) ---
  /** Текст сообщения */
  messageText?: string;
  /** Без уведомления */
  disableNotification?: boolean;

  // --- Для ban/kick/mute ---
  /** Причина */
  reason?: string;
  /** Unix timestamp окончания бана (0 = навсегда) */
  untilDate?: number;
  /** Длительность мута в секундах */
  duration?: number;
  /** Разрешить отправку сообщений */
  canSendMessages?: boolean;
  /** Устаревшее общее право на медиа. В Python не передаётся */
  canSendMediaMessages?: boolean;
  /** Разрешить аудио. Пусто — как canSendMediaMessages */
  canSendAudios?: boolean;
  /** Разрешить документы. Пусто — как canSendMediaMessages */
  canSendDocuments?: boolean;
  /** Разрешить фото. Пусто — как canSendMediaMessages */
  canSendPhotos?: boolean;
  /** Разрешить видео. Пусто — как canSendMediaMessages */
  canSendVideos?: boolean;
  /** Разрешить видеозаметки. Пусто — как canSendMediaMessages */
  canSendVideoNotes?: boolean;
  /** Разрешить голосовые. Пусто — как canSendMediaMessages */
  canSendVoiceNotes?: boolean;
  /** Разрешить опросы */
  canSendPolls?: boolean;
  /** Разрешить стикеры и прочие сообщения */
  canSendOtherMessages?: boolean;
  /** Разрешить предпросмотр ссылок */
  canAddWebPagePreviews?: boolean;
  /** Разрешить реакции. Пусто — как canSendMediaMessages */
  canReactToMessages?: boolean;
  /** Разрешить менять описание группы */
  canChangeGroupInfo?: boolean;
  /** Разрешить приглашения */
  canInviteUsers2?: boolean;
  /** Разрешить закрепление */
  canPinMessages2?: boolean;

  // --- Для promote_user ---
  /** Удаление сообщений */
  canDeleteMessages?: boolean;
  /** Приглашение пользователей */
  canInviteUsers?: boolean;
  /** Закрепление сообщений */
  canPinMessages?: boolean;
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

/** Параметры для генерации всех обработчиков синонимов */
export interface SynonymsTemplateParams {
  /** Массив синонимов */
  synonyms: SynonymEntry[];
}
