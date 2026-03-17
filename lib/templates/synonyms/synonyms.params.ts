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
  synonym: string;
  nodeId: string;
  nodeType: SynonymNodeType;
  /** Для command/start */
  functionName?: string;
  originalCommand?: string;
  /** Для content management (pin/unpin/delete) */
  messageText?: string;
  disableNotification?: boolean;
  /** Для ban/kick/mute */
  reason?: string;
  /** Для ban_user (0 = навсегда) */
  untilDate?: number;
  /** Для mute_user (секунды) */
  duration?: number;
  canSendMessages?: boolean;
  canSendMediaMessages?: boolean;
  /** Для promote_user */
  canDeleteMessages?: boolean;
  canInviteUsers?: boolean;
  canPinMessages?: boolean;
}

/** Параметры для генерации всех обработчиков синонимов */
export interface SynonymsTemplateParams {
  synonyms: SynonymEntry[];
}
