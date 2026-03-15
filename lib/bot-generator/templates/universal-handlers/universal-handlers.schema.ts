/**
 * @fileoverview Zod схема для валидации параметров универсальных обработчиков
 * @module templates/universal-handlers/universal-handlers.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров универсальных обработчиков */
export const universalHandlersParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().optional(),
});

/** Тип параметров (выведен из схемы) */
export type UniversalHandlersParams = z.infer<typeof universalHandlersParamsSchema>;
