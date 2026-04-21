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
  /** URL вебхука (если задан — включается webhook режим) */
  webhookUrl: z.string().nullable().optional().default(null),
  /** Порт aiohttp сервера для webhook режима */
  webhookPort: z.number().nullable().optional().default(null),
  /** ID токена для формирования пути вебхука */
  tokenId: z.number().nullable().optional().default(null),
  /** ID проекта для формирования пути вебхука */
  projectId: z.number().nullable().optional().default(null),
});

/** Тип параметров запуска бота (выведен из схемы) */
export type MainParams = z.infer<typeof mainParamsSchema>;
