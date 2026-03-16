/**
 * @fileoverview Zod схема для валидации параметров запуска бота
 * @module templates/schemas/main-schema
 */

import { z } from 'zod';

/** Схема для валидации параметров запуска бота */
export const mainParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().default(false),
});

/** Тип параметров запуска бота (выведен из схемы) */
export type MainParams = z.infer<typeof mainParamsSchema>;
