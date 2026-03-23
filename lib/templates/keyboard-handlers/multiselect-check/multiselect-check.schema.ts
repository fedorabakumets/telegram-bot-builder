/**
 * @fileoverview Zod схема для шаблона проверки множественного выбора
 * @module templates/multiselect-check/multiselect-check.schema
 */

import { z } from 'zod';

const multiSelectButtonSchema = z.object({
  id: z.string(),
  text: z.string(),
  action: z.string(),
  target: z.string().optional(),
});

const nodeDataSchema = z.object({
  messageText: z.string().optional(),
  keyboardType: z.string().optional(),
  buttons: z.array(multiSelectButtonSchema).optional(),
  resizeKeyboard: z.boolean().optional(),
  oneTimeKeyboard: z.boolean().optional(),
  allowMultipleSelection: z.boolean().optional(),
  multiSelectVariable: z.string().optional(),
  continueButtonText: z.string().optional(),
  continueButtonTarget: z.string().optional(),
});

const multiSelectNodeSchema = z.object({
  id: z.string(),
  safeName: z.string(),
  type: z.string(),
  data: nodeDataSchema,
});

export const multiSelectCheckParamsSchema = z.object({
  nodes: z.array(multiSelectNodeSchema),
  allNodeIds: z.array(z.string()),
  indentLevel: z.string().optional(),
});

export type MultiSelectCheckParams = z.infer<typeof multiSelectCheckParamsSchema>;
