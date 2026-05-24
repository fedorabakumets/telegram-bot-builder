/**
 * @fileoverview Zod-схема для валидации параметров узла delete_message
 * @module templates/delete-message/delete-message.schema
 */

import { z } from 'zod';

/** Режим определения ID сообщения */
export const deleteMessageIdSourceSchema = z.enum(['current_message', 'last_bot_message', 'last_n', 'custom']);

/** Режим определения ID чата */
export const deleteMessageChatIdSourceSchema = z.enum(['current_chat', 'custom']);

/** Схема одного узла delete_message */
const deleteMessageEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string().min(1),
  /** Безопасное имя для Python-функции */
  safeName: z.string().min(1),
  /** ID следующего узла (автопереход) */
  targetNodeId: z.string().default(''),
  /** Тип следующего узла */
  targetNodeType: z.string().default(''),
  /** Источник ID сообщения */
  messageIdSource: deleteMessageIdSourceSchema.default('current_message'),
  /** ID сообщения вручную или {переменная} */
  messageIdManual: z.string().default(''),
  /** Количество последних сообщений */
  lastNCount: z.string().default(''),
  /** Источник ID чата */
  chatIdSource: deleteMessageChatIdSourceSchema.default('current_chat'),
  /** ID чата вручную или {переменная} */
  chatIdManual: z.string().default(''),
  /** Не прерывать сценарий при ошибке */
  ignoreErrors: z.boolean().default(true),
  /** Множественное удаление из переменной-массива */
  bulkDelete: z.boolean().default(false),
  /** Имя переменной с массивом message_id */
  bulkMessageIdsVariable: z.string().default(''),
});

/** Схема параметров шаблона delete_message */
export const deleteMessageParamsSchema = z.object({
  /** Массив узлов delete_message */
  entries: z.array(deleteMessageEntrySchema),
});

/** Тип параметров шаблона */
export type DeleteMessageParams = z.infer<typeof deleteMessageParamsSchema>;
