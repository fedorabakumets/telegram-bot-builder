/**
 * @fileoverview Параметры для шаблона обработчиков узла answer_callback_query
 * @module templates/answer-callback-query/answer-callback-query.params
 */

/**
 * Один узел answer_callback_query
 */
export interface AnswerCallbackQueryEntry {
  /** ID узла answer_callback_query */
  nodeId: string;
  /** ID целевого узла (следующий шаг) */
  targetNodeId: string;
  /** Тип целевого узла */
  targetNodeType: string;
  /** Текст уведомления (уже с подставленными переменными) */
  notificationText: string;
  /** true = показать алерт с кнопкой OK, false = тост-уведомление */
  showAlert: boolean;
  /** Время кеширования ответа в секундах */
  cacheTime: number;
}

/**
 * Параметры для генерации обработчиков узла answer_callback_query
 */
export interface AnswerCallbackQueryTemplateParams {
  /** Массив узлов answer_callback_query */
  entries: AnswerCallbackQueryEntry[];
}
