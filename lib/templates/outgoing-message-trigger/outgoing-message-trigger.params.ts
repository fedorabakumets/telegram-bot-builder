/**
 * @fileoverview Параметры для шаблона обработчиков триггеров исходящих сообщений
 * @module templates/outgoing-message-trigger/outgoing-message-trigger.params
 */

/** Один узел outgoing_message_trigger */
export interface OutgoingMessageTriggerEntry {
  /** ID узла outgoing_message_trigger */
  nodeId: string;
  /** ID целевого узла */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
}

/** Параметры для генерации обработчиков триггеров исходящих сообщений */
export interface OutgoingMessageTriggerTemplateParams {
  /** Массив триггеров исходящих сообщений */
  entries: OutgoingMessageTriggerEntry[];
}
