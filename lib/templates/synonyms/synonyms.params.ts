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
  /** Разрешить отправку медиа */
  canSendMediaMessages?: boolean;

  // --- Для promote_user ---
  /** Удаление сообщений */
  canDeleteMessages?: boolean;
  /** Приглашение пользователей */
  canInviteUsers?: boolean;
  /** Закрепление сообщений */
  canPinMessages?: boolean;
}

/** Параметры для генерации всех обработчиков синонимов */
export interface SynonymsTemplateParams {
  /** Массив синонимов */
  synonyms: SynonymEntry[];
}
