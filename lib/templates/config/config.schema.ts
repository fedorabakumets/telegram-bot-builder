/**
 * @fileoverview Zod схема для валидации параметров конфигурации
 * @module templates/config/config.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров конфигурации */
export const configParamsSchema = z.object({
  /** Включена ли база данных пользователей (asyncpg, json) */
  userDatabaseEnabled: z.boolean().default(false),
  /** ID проекта для сохранения в базу данных */
  projectId: z.number().nullable().default(null),
});

/** Тип параметров конфигурации (выведен из схемы) */
export type ConfigParams = z.infer<typeof configParamsSchema>;
