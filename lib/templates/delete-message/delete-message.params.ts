/**
 * @fileoverview Параметры шаблона узла delete_message
 * @module templates/delete-message/delete-message.params
 */

/** Режим определения ID сообщения для удаления */
export type DeleteMessageIdSource = 'current_message' | 'last_bot_message' | 'reply_message' | 'last_n' | 'custom';

/** Режим определения ID чата */
export type DeleteMessageChatIdSource = 'current_chat' | 'custom';

/**
 * Один узел delete_message
 */
export interface DeleteMessageEntry {
  /** ID узла */
  nodeId: string;
  /** Безопасное имя для Python-функции */
  safeName: string;
  /** ID следующего узла (автопереход) */
  targetNodeId: string;
  /** Тип следующего узла */
  targetNodeType: string;
  /** Источник ID сообщения */
  messageIdSource: DeleteMessageIdSource;
  /** ID сообщения вручную или {переменная} — для режима custom */
  messageIdManual: string;
  /** Количество последних сообщений — для режима last_n */
  lastNCount: string;
  /** Источник ID чата */
  chatIdSource: DeleteMessageChatIdSource;
  /** ID чата вручную или {переменная} — для режима custom */
  chatIdManual: string;
  /** Не прерывать сценарий при ошибке */
  ignoreErrors: boolean;
  /** Множественное удаление из переменной-массива */
  bulkDelete: boolean;
  /** Имя переменной с массивом message_id */
  bulkMessageIdsVariable: string;
}

/**
 * Параметры для генерации обработчиков узла delete_message
 */
export interface DeleteMessageTemplateParams {
  /** Массив узлов delete_message */
  entries: DeleteMessageEntry[];
}
