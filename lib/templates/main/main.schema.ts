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
  /** Список команд меню для BotFather */
  menuCommands: z.array(z.object({
    command: z.string(),
    description: z.string(),
  })).optional().default([]),
  /** Автоматически регистрировать пользователей при первом обращении */
  autoRegisterUsers: z.boolean().optional().default(false),
  /** Список имён middleware функций для incoming_message_trigger */
  incomingMessageTriggerMiddlewares: z.array(z.string()).optional().default([]),
});

/** Тип параметров запуска (выведен из схемы) */
export type MainParams = z.infer<typeof mainParamsSchema>;
