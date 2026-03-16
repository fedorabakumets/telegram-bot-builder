/**
 * @fileoverview Zod схема для валидации параметров multi-select done обработчика
 * @module templates/handlers/multi-select-done/multi-select-done.schema
 */

import { z } from 'zod';

/** Схема для кнопки multi-select */
const multiSelectButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.string(),
  target: z.string().optional(),
  url: z.string().optional(),
  callbackData: z.string().optional(),
});

/** Схема для данных узла */
const nodeDataSchema = z.object({
  keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
  allowMultipleSelection: z.boolean().optional(),
  buttons: z.array(multiSelectButtonSchema).optional(),
  messageText: z.string().optional(),
  continueButtonText: z.string().optional(),
  multiSelectVariable: z.string().optional(),
  resizeKeyboard: z.boolean().optional(),
  oneTimeKeyboard: z.boolean().optional(),
});

/** Схема для целевого узла */
const targetNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: nodeDataSchema,
  shortId: z.string().optional(),
  keyboardCode: z.string().optional(),
  adjustCode: z.string().optional(),
});

/** Схема для узла multi-select done */
const multiSelectDoneNodeSchema = z.object({
  id: z.string(),
  variableName: z.string(),
  continueButtonTarget: z.string().optional(),
  targetNode: targetNodeSchema.optional(),
});

/** Схема для валидации параметров multi-select done */
export const multiSelectDoneParamsSchema = z.object({
  multiSelectNodes: z.array(multiSelectDoneNodeSchema),
  allNodes: z.array(z.any()),
  allNodeIds: z.array(z.string()),
  indentLevel: z.string().optional().default(''),
});

export type MultiSelectDoneParams = z.infer<typeof multiSelectDoneParamsSchema>;
