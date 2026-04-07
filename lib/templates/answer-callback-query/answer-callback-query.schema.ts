/**
 * @fileoverview Zod схема для валидации параметров узла answer_callback_query
 * @module templates/answer-callback-query/answer-callback-query.schema
 */

import { z } from 'zod';

/**
 * Схема одного узла answer_callback_query.
 * nodeId, targetNodeId, targetNodeType — обязательные поля.
 */
const answerCallbackQueryEntrySchema = z.object({
  /** ID узла answer_callback_query */
  nodeId: z.string(),
  /** ID целевого узла */
  targetNodeId: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string(),
  /** Текст уведомления (0–200 символов) */
  notificationText: z.string(),
  /** Показывать алерт (true) или тост (false) */
  showAlert: z.boolean(),
  /** Время кеширования в секундах */
  cacheTime: z.number(),
});

/**
 * Схема параметров шаблона узла answer_callback_query
 */
export const answerCallbackQueryParamsSchema = z.object({
  /** Массив узлов answer_callback_query */
  entries: z.array(answerCallbackQueryEntrySchema),
});

export type AnswerCallbackQueryParams = z.infer<typeof answerCallbackQueryParamsSchema>;
