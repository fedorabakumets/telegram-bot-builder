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
  /** URL вебхука (если задан — включается webhook режим) */
  webhookUrl: z.string().nullable().optional().default(null),
  /** Порт aiohttp сервера для webhook режима */
  webhookPort: z.number().nullable().optional().default(null),
  /** Есть ли узлы userbot_message (нужен Telethon клиент) */
  hasUserbotNodes: z.boolean().default(false),
  /** Генерировать обёртку защиты контента от копирования/пересылки */
  protectContent: z.boolean().optional().default(false),
});

/** Тип параметров конфигурации (выведен из схемы) */
export type ConfigParams = z.infer<typeof configParamsSchema>;
