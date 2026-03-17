/**
 * @fileoverview Zod схема для валидации параметров шаблона auto-transition
 * @module templates/auto-transition/auto-transition.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров автоперехода */
export const autoTransitionParamsSchema = z.object({
  /** ID текущего узла */
  nodeId: z.string(),
  /** ID целевого узла автоперехода */
  autoTransitionTarget: z.string(),
  /** Существует ли целевой узел в графе */
  targetExists: z.boolean(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type AutoTransitionParams = z.infer<typeof autoTransitionParamsSchema>;
