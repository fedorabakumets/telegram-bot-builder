/**
 * @fileoverview Zod схема для валидации параметров узла edit_message
 * @module templates/edit-message/edit-message.schema
 */

import { z } from 'zod';

/**
 * Схема одного узла edit_message.
 * Все поля строковые; режимы — произвольные строки для гибкости.
 */
const editMessageEntrySchema = z.object({
  /** ID узла edit_message */
  nodeId: z.string(),
  /** ID следующего узла */
  targetNodeId: z.string(),
  /** Тип следующего узла */
  targetNodeType: z.string(),
  /** Режим редактирования: 'text' | 'markup' | 'both' */
  editMode: z.string(),
  /** Новый текст сообщения */
  editMessageText: z.string(),
  /** Режим форматирования: 'html' | 'markdown' | 'none' */
  editFormatMode: z.string(),
  /** Источник ID сообщения: 'last_bot_message' | 'custom' */
  editMessageIdSource: z.string(),
  /** ID сообщения вручную или {переменная} */
  editMessageIdManual: z.string(),
  /** Режим клавиатуры: 'keep' | 'remove' | 'node' */
  editKeyboardMode: z.string(),
  /** ID keyboard-узла */
  editKeyboardNodeId: z.string(),
});

/**
 * Схема параметров шаблона узла edit_message
 */
export const editMessageParamsSchema = z.object({
  /** Массив узлов edit_message */
  entries: z.array(editMessageEntrySchema),
});

export type EditMessageParams = z.infer<typeof editMessageParamsSchema>;
