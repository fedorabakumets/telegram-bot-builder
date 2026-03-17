/**
 * @fileoverview Zod-схема для валидации параметров шаблона get_user_variables
 * @module templates/user-variables-func/user-variables-func.schema
 */

import { z } from 'zod';

/**
 * Схема валидации параметров шаблона функции get_user_variables
 */
export const userVariablesFuncParamsSchema = z.object({
  /** Базовый отступ для генерируемого кода (по умолчанию '') */
  indentLevel: z.string().optional().default(''),
});

/** Тип параметров, выведенный из схемы */
export type UserVariablesFuncParams = z.infer<typeof userVariablesFuncParamsSchema>;
