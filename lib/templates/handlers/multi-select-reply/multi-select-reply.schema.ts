/**
 * @fileoverview Zod схема для валидации параметров multi-select reply обработчика
 * @module templates/handlers/multi-select-reply/multi-select-reply.schema
 */

import { z } from 'zod';

/** Схема для кнопки выбора */
const selectionButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.literal('selection'),
  target: z.string().optional(),
});

/** Схема для обычной кнопки */
const regularButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.enum(['goto', 'url', 'command']),
  target: z.string().optional(),
});

/** Схема для кнопки перехода */
const gotoButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.literal('goto'),
  target: z.string(),
  targetNode: z.object({
    id: z.string(),
    type: z.string(),
    data: z.object({
      command: z.string().optional(),
    }),
  }).optional(),
});

/** Схема для кнопки завершения */
const completeButtonSchema = z.object({
  text: z.string(),
  target: z.string().optional(),
});

/** Схема для данных узла */
const nodeDataSchema = z.object({
  keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
  allowMultipleSelection: z.boolean().optional(),
  buttons: z.array(z.any()).optional(),
  messageText: z.string().optional(),
  continueButtonText: z.string().optional(),
  multiSelectVariable: z.string().optional(),
  resizeKeyboard: z.boolean().optional(),
  oneTimeKeyboard: z.boolean().optional(),
  command: z.string().optional(),
});

/** Схема для целевого узла */
const targetNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: nodeDataSchema,
  keyboardCode: z.string().optional(),
});

/** Схема для узла multi-select reply */
const multiSelectReplyNodeSchema = z.object({
  id: z.string(),
  variableName: z.string(),
  continueButtonTarget: z.string().optional(),
  continueButtonText: z.string().optional(),
  completeButton: completeButtonSchema.optional(),
  selectionButtons: z.array(selectionButtonSchema),
  regularButtons: z.array(regularButtonSchema),
  gotoButtons: z.array(gotoButtonSchema),
  adjustCode: z.string().optional(),
  resizeKeyboard: z.boolean().optional(),
  oneTimeKeyboard: z.boolean().optional(),
  messageText: z.string().optional(),
  targetNode: targetNodeSchema.optional(),
});

/** Схема для валидации параметров multi-select reply */
export const multiSelectReplyParamsSchema = z.object({
  multiSelectNodes: z.array(multiSelectReplyNodeSchema),
  allNodes: z.array(z.any()),
  allNodeIds: z.array(z.string()),
  indentLevel: z.string().optional().default(''),
});

export type MultiSelectReplyParams = z.infer<typeof multiSelectReplyParamsSchema>;
