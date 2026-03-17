/**
 * @fileoverview Zod схема для валидации параметров конфигурации
 * @module templates/schemas/config-schema
 */

import { z } from 'zod';

/** Схема для валидации параметров конфигурации */
export const configParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().default(false),
  projectId: z.number().nullable().default(null),
});

/** Тип параметров конфигурации (выведен из схемы) */
export type ConfigParams = z.infer<typeof configParamsSchema>;
