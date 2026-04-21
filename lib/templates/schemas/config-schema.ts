/**
 * @fileoverview Zod схема для валидации параметров конфигурации
 * @module templates/schemas/config-schema
 */

import { z } from 'zod';

/** Схема для валидации параметров конфигурации */
export const configParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().default(false),
  projectId: z.number().nullable().default(null),
  /** URL вебхука (если задан — включается webhook режим) */
  webhookUrl: z.string().nullable().optional().default(null),
  /** Порт aiohttp сервера для webhook режима */
  webhookPort: z.number().nullable().optional().default(null),
});

/** Тип параметров конфигурации (выведен из схемы) */
export type ConfigParams = z.infer<typeof configParamsSchema>;
