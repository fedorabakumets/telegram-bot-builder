/**
 * @fileoverview Zod схема для валидации параметров multi-select-transition
 * @module templates/handlers/multi-select-transition/multi-select-transition.schema
 */

import { z } from 'zod';

/** Схема соединения между узлами */
export const nodeConnectionSchema = z.object({
  source: z.string(),
  target: z.string(),
});

/** Схема узла с множественным выбором для переходов */
export const multiSelectNodeForTransitionSchema = z.object({
  id: z.string(),
  data: z.object({
    continueButtonTarget: z.string().optional(),
    keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
    messageText: z.string().optional(),
    command: z.string().optional(),
    buttons: z.array(z.any()).optional(),
  }),
  connections: z.array(nodeConnectionSchema).optional(),
});

/** Схема параметров для генерации логики переходов multi-select */
export const multiSelectTransitionParamsSchema = z.object({
  multiSelectNodes: z.array(multiSelectNodeForTransitionSchema),
  nodes: z.array(z.any()),
  connections: z.array(nodeConnectionSchema).optional(),
  indentLevel: z.string().optional().default('        '),
});

export type MultiSelectTransitionParams = z.infer<typeof multiSelectTransitionParamsSchema>;
