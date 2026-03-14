/**
 * @fileoverview Zod схема для валидации параметров базы данных
 * @module templates/schemas/database-schema
 */

import { z } from 'zod';

/** Схема для валидации параметров базы данных */
export const databaseParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().default(false),
});

/** Тип параметров базы данных (выведен из схемы) */
export type DatabaseParams = z.infer<typeof databaseParamsSchema>;
