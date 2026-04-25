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
  /** Паттерн фильтрации callback_data (опционально) */
  callbackPattern?: string;
  /** Тип сопоставления паттерна: "startsWith" | "equals" | "contains" */
  callbackMatchType?: string;
  /** Префикс для удаления из callback_data перед сохранением в переменную */
  callbackDataStripPrefix?: string;
}

/** Минимальное описание узла для навигации в waiting_callback_input_middleware */
export interface CallbackNodeRef {
  /** Идентификатор узла */
  id: string;
  /** Безопасное имя для генерации имени функции */
  safeName: string;
}

/** Параметры для генерации middleware триггеров входящих callback_query */
export interface IncomingCallbackTriggerTemplateParams {
  /** Массив триггеров входящих callback_query */
  entries: IncomingCallbackTriggerEntry[];
  /** Все узлы проекта для навигации в waiting_callback_input_middleware */
  allNodes?: CallbackNodeRef[];
}
