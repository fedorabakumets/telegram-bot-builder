/**
 * @fileoverview Zod схема для валидации параметров базы данных
 * @module templates/database/database.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров базы данных */
export const databaseParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().default(false),
  hasMessageLogging: z.boolean().default(false),
  hasUserIdsTable: z.boolean().default(false),
  hasTelegramSettingsTable: z.boolean().default(false),
});

/** Тип параметров базы данных (выведен из схемы) */
export type DatabaseParams = z.infer<typeof databaseParamsSchema>;
