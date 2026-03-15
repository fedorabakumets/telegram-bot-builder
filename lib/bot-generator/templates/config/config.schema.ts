/**
 * @fileoverview Zod схема для валидации параметров конфигурации
 * @module templates/config/config.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров конфигурации */
export const configParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().optional(),
  projectId: z.number().nullable().optional(),
});

/** Тип параметров конфигурации (выведен из схемы) */
export type ConfigParams = z.infer<typeof configParamsSchema>;
