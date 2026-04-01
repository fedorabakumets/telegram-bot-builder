/**
 * @fileoverview Параметры для шаблона middleware триггера входящего сообщения
 * @module templates/incoming-message-trigger/incoming-message-trigger.params
 */

/** Один узел incoming_message_trigger */
export interface IncomingMessageTriggerEntry {
  /** ID узла incoming_message_trigger */
  nodeId: string;
  /** ID целевого узла */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
}

/** Параметры для генерации middleware триггеров входящих сообщений */
export interface IncomingMessageTriggerTemplateParams {
  /** Массив триггеров входящих сообщений */
  entries: IncomingMessageTriggerEntry[];
}
