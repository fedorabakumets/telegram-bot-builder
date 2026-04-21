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
  /** Список имён middleware функций для managed_bot_updated_trigger */
  managedBotUpdatedTriggerMiddlewares: z.array(z.string()).optional().default([]),
  /** URL вебхука (если задан — включается webhook режим) */
  webhookUrl: z.string().nullable().optional().default(null),
  /** Порт aiohttp сервера для webhook режима */
  webhookPort: z.number().nullable().optional().default(null),
  /** ID токена для формирования пути вебхука */
  tokenId: z.number().nullable().optional().default(null),
  /** ID проекта для формирования пути вебхука */
  projectId: z.number().nullable().optional().default(null),
});

/** Тип параметров запуска (выведен из схемы) */
export type MainParams = z.infer<typeof mainParamsSchema>;
