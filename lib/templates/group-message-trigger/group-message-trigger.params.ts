/**
 * @fileoverview Параметры для шаблона обработчика триггера сообщения в топике группы
 * @module templates/group-message-trigger/group-message-trigger.params
 */

/** Источник ID группы: "manual" — вручную, "variable" — из переменной */
export type GroupChatIdSource = 'manual' | 'variable';

/** Один узел group_message_trigger */
export interface GroupMessageTriggerEntry {
  /** ID узла group_message_trigger */
  nodeId: string;
  /** Безопасное имя для Python-идентификаторов */
  safeName: string;
  /** Числовой ID группы (без префикса -100) */
  groupChatId: string;
  /** Источник ID группы */
  groupChatIdSource: GroupChatIdSource;
  /** Имя переменной с ID группы (если source=variable) */
  groupChatVariableName: string;
  /** Имя переменной где у пользователей хранится thread_id */
  threadIdVariable: string;
  /** Имя переменной куда положить найденный user_id */
  resolvedUserIdVariable: string;
  /** ID целевого узла */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
}

/** Параметры для генерации обработчиков триггеров сообщений в группе */
export interface GroupMessageTriggerTemplateParams {
  /** Массив триггеров сообщений в группе */
  entries: GroupMessageTriggerEntry[];
}
