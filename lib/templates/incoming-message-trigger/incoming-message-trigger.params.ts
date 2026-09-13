/**
 * @fileoverview Параметры для шаблона middleware триггера входящего сообщения
 * @module templates/incoming-message-trigger/incoming-message-trigger.params
 */

/** Фильтр типа чата для incoming_message_trigger */
export type ImtChatTypeFilter = 'any' | 'private' | 'group';

/** Источник ID группы для incoming_message_trigger */
export type ImtGroupChatIdSource = 'manual' | 'variable';

/** Один узел incoming_message_trigger */
export interface IncomingMessageTriggerEntry {
  /** ID узла incoming_message_trigger */
  nodeId: string;
  /** ID целевого узла */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Фильтр типа чата */
  chatTypeFilter: ImtChatTypeFilter;
  /** ID группы (без префикса -100) */
  groupChatId: string;
  /** Источник ID группы */
  groupChatIdSource: ImtGroupChatIdSource;
  /** Имя переменной с ID группы (при source=variable) */
  groupChatVariableName: string;
  /** Проверять флаг _stop_processing перед вызовом handler */
  stopOnFlag: boolean;
}

/** Параметры для генерации middleware триггеров входящих сообщений */
export interface IncomingMessageTriggerTemplateParams {
  /** Массив триггеров входящих сообщений */
  entries: IncomingMessageTriggerEntry[];
}
