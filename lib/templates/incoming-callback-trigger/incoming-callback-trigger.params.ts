/**
 * @fileoverview Параметры для шаблона middleware триггера входящего callback_query
 * @module templates/incoming-callback-trigger/incoming-callback-trigger.params
 */

/** Один узел incoming_callback_trigger */
export interface IncomingCallbackTriggerEntry {
  /** ID узла incoming_callback_trigger */
  nodeId: string;
  /** ID целевого узла */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
}

/** Параметры для генерации middleware триггеров входящих callback_query */
export interface IncomingCallbackTriggerTemplateParams {
  /** Массив триггеров входящих callback_query */
  entries: IncomingCallbackTriggerEntry[];
}
