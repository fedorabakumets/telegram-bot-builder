/**
 * @fileoverview Zod схема для валидации параметров runtime-обработки пользовательского ввода
 * @module templates/handle-user-input/handle-user-input.schema
 */

import { z } from 'zod';

export const handleUserInputParamsSchema = z.object({
  indentLevel: z.string().optional(),
});

export type HandleUserInputParams = z.infer<typeof handleUserInputParamsSchema>;
