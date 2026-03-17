/**
 * @fileoverview Zod схема для валидации параметров шаблона conditional-branch
 * @module templates/conditional-branch/conditional-branch.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров условного ветвления */
export const conditionalBranchParamsSchema = z.object({
  /** Индекс узла (0 = if, >0 = elif) */
  index: z.number().int().min(0),
  /** ID узла */
  nodeId: z.string(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type ConditionalBranchParams = z.infer<typeof conditionalBranchParamsSchema>;
