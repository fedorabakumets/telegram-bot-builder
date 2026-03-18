/**
 * @fileoverview Zod схема для валидации параметров базы данных
 * @module templates/database/database.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров базы данных */
export const databaseParamsSchema = z.object({
  /** Включена ли база данных пользователей (asyncpg) */
  userDatabaseEnabled: z.boolean().default(false),
  /** Есть логирование сообщений (нужна таблица bot_messages) */
  hasMessageLogging: z.boolean().default(false),
  /** Есть таблица user_ids */
  hasUserIdsTable: z.boolean().default(false),
  /** Есть таблица user_telegram_settings */
  hasTelegramSettingsTable: z.boolean().default(false),
  /** Нужны функции чтения/записи переменных пользователя */
  hasUserDataAccess: z.boolean().default(false),
});

/** Тип параметров базы данных (выведен из схемы) */
export type DatabaseParams = z.infer<typeof databaseParamsSchema>;
