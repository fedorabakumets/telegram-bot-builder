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
  /** Текст синонима */
  synonym: string;
  /** ID узла */
  nodeId: string;
  /** Тип узла */
  nodeType: SynonymNodeType;
  /** Имя функции-обработчика оригинальной команды (для command/start) */
  functionName?: string;
  /** Оригинальная команда (для command/start) */
  originalCommand?: string;
  /** Текст ответного сообщения (для content management) */
  messageText?: string;
  /** Отключить уведомление при закреплении (для pin_message) */
  disableNotification?: boolean;
}

/** Параметры для генерации всех обработчиков синонимов */
export interface SynonymsTemplateParams {
  /** Массив синонимов для генерации */
  synonyms: SynonymEntry[];
}
