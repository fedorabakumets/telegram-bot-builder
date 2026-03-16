/**
 * @fileoverview Zod схема для валидации параметров multi-select button обработчика
 * @module templates/handlers/multi-select-button-handler/multi-select-button-handler.schema
 */

import { z } from 'zod';

/** Схема для кнопки */
const buttonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.string(),
  target: z.string().optional(),
  url: z.string().optional(),
  skipDataCollection: z.boolean().optional(),
});

/** Схема для текущего узла */
const nodeSchema = z.object({
  id: z.string(),
  inputVariable: z.string().optional(),
});

/** Схема для целевого узла */
const targetNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  allowMultipleSelection: z.boolean().optional(),
  continueButtonTarget: z.string().optional(),
  multiSelectVariable: z.string().optional(),
  data: z.object({
    allowMultipleSelection: z.boolean().optional(),
    continueButtonTarget: z.string().optional(),
    multiSelectVariable: z.string().optional(),
    keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
    buttons: z.array(z.any()).optional(),
    messageText: z.string().optional(),
    resizeKeyboard: z.boolean().optional(),
    oneTimeKeyboard: z.boolean().optional(),
    command: z.string().optional(),
  }),
});

/** Схема для узла в списке nodes */
const simpleNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.any(),
});

/** Схема для валидации параметров multi-select button обработчика */
export const multiSelectButtonHandlerParamsSchema = z.object({
  targetNode: targetNodeSchema.optional(),
  callbackData: z.string(),
  shortNodeIdForDone: z.string().optional(),
  button: buttonSchema,
  node: nodeSchema,
  nodes: z.array(simpleNodeSchema),
  indentLevel: z.string().optional().default('    '),
});

export type MultiSelectButtonHandlerParams = z.infer<typeof multiSelectButtonHandlerParamsSchema>;
