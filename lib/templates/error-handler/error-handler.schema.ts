/**
 * @fileoverview Zod схема для валидации параметров шаблона error-handler
 * @module templates/error-handler/error-handler.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров обработчика ошибок */
export const errorHandlerParamsSchema = z.object({
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type ErrorHandlerParams = z.infer<typeof errorHandlerParamsSchema>;
