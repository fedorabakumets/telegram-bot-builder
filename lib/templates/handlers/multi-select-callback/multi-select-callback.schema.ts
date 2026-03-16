/**
 * @fileoverview Zod схема для валидации параметров multi-select callback обработчика
 * @module templates/handlers/multi-select-callback/multi-select-callback.schema
 */

import { z } from 'zod';

/** Схема для кнопки multi-select */
const multiSelectButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.string(),
  target: z.string().optional(),
  url: z.string().optional(),
  value: z.string(),
  valueTruncated: z.string(),
  escapedText: z.string(),
  callbackData: z.string(),
});

/** Схема для обычной кнопки */
const regularButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.enum(['goto', 'url', 'command']),
  target: z.string().optional(),
  url: z.string().optional(),
});

/** Схема для кнопки завершения */
const completeButtonSchema = z.object({
  text: z.string(),
  target: z.string(),
});

/** Схема для узла multi-select */
const multiSelectNodeSchema = z.object({
  id: z.string(),
  shortNodeId: z.string(),
  selectionButtons: z.array(multiSelectButtonSchema),
  regularButtons: z.array(regularButtonSchema),
  completeButton: completeButtonSchema.optional(),
  doneCallbackData: z.string().optional(),
  hasKeyboardLayout: z.boolean().optional(),
  keyboardLayoutAuto: z.boolean().optional(),
  adjustCode: z.string().optional(),
  totalButtonsCount: z.number().optional(),
});

/** Схема для валидации параметров multi-select callback */
export const multiSelectCallbackParamsSchema = z.object({
  multiSelectNodes: z.array(multiSelectNodeSchema),
  allNodeIds: z.array(z.string()),
  indentLevel: z.string().optional().default('    '),
});

export type MultiSelectCallbackParams = z.infer<typeof multiSelectCallbackParamsSchema>;
