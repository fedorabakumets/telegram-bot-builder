/**
 * @fileoverview Zod схема для валидации параметров запуска бота
 * @module templates/schemas/main-schema
 */

import { z } from 'zod';

/** Схема для валидации параметров запуска бота */
export const mainParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().default(false),
  menuCommands: z.array(z.object({
    command: z.string(),
    description: z.string(),
  })).optional().default([]),
  hasInlineButtons: z.boolean().optional().default(false),
  /** Автоматически регистрировать пользователей при первом обращении */
  autoRegisterUsers: z.boolean().optional().default(false),
  /** Список имён middleware функций для incoming_message_trigger */
  incomingMessageTriggerMiddlewares: z.array(z.string()).optional().default([]),
  /** Список имён обработчиков для group_message_trigger */
  groupMessageTriggerHandlers: z.array(z.string()).optional().default([]),
});

/** Тип параметров запуска бота (выведен из схемы) */
export type MainParams = z.infer<typeof mainParamsSchema>;
