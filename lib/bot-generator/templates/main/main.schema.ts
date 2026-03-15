/**
 * @fileoverview Zod схема для валидации параметров запуска
 * @module templates/main/main.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров запуска бота */
export const mainParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().optional(),
});

/** Тип параметров запуска (выведен из схемы) */
export type MainParams = z.infer<typeof mainParamsSchema>;
