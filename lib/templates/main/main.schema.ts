/**
 * @fileoverview Zod схема для валидации параметров запуска
 * @module templates/main/main.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров запуска бота */
export const mainParamsSchema = z.object({
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: z.boolean().optional().default(false),
  /** Есть ли inline кнопки */
  hasInlineButtons: z.boolean().optional().default(false),
  /** Количество команд меню */
  menuCommandsCount: z.number().optional().default(0),
});

/** Тип параметров запуска (выведен из схемы) */
export type MainParams = z.infer<typeof mainParamsSchema>;
