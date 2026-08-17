/**
 * @fileoverview Zod-схема для валидации параметров шаблона set-variable
 * @module templates/set-variable/set-variable.schema
 */

import { z } from 'zod';
import { assignmentSchema } from '@shared/schema/tables/assignment-schema';

/** Схема для валидации параметров узла set_variable */
export const setVariableParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Список присваиваний переменных */
  assignments: z.array(assignmentSchema),
  /** ID следующего узла для автоперехода */
  autoTransitionTo: z.string(),
});

export type SetVariableParams = z.infer<typeof setVariableParamsSchema>;
