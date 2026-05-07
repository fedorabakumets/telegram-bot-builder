/**
 * @fileoverview Zod-схема для валидации параметров шаблона set-variable
 * @module templates/set-variable/set-variable.schema
 */

import { z } from 'zod';

/** Схема одного присваивания переменной */
const setVariableAssignmentSchema = z.object({
  /** Уникальный идентификатор присваивания */
  id: z.string(),
  /** Имя переменной для записи */
  variable: z.string(),
  /** Значение или шаблон с {переменными} */
  value: z.string(),
  /** Режим: "text" — шаблон, "expression" — арифметическое выражение */
  mode: z.enum(['text', 'expression']),
});

/** Схема для валидации параметров узла set_variable */
export const setVariableParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Список присваиваний переменных */
  assignments: z.array(setVariableAssignmentSchema),
  /** ID следующего узла для автоперехода */
  autoTransitionTo: z.string(),
});

export type SetVariableParams = z.infer<typeof setVariableParamsSchema>;
