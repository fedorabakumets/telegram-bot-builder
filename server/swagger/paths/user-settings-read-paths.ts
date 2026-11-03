/** @fileoverview Документация точного пользователя и безопасного DTO настроек без секрета бота. */
import '../schemas/common';
import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { botTokens } from '../../../shared/schema/tables/bot-tokens';
import { MessageErrorSchema, UnauthorizedSchema } from '../schemas/common';
/** Безопасный DTO повторяет белый список getBotSettingsHandler, типы берутся из общей таблицы. */
const settings = createSelectSchema(botTokens).pick({
  id: true, projectId: true, name: true, botUsername: true, botFirstName: true,
  botDescription: true, botShortDescription: true, autoRestart: true, maxRestartAttempts: true,
  protectContent: true, saveIncomingMedia: true, catchAllHandlers: true, trackUserBlocks: true,
  trackGroupMembership: true, contentCache: true, logLevel: true, launchMode: true,
  webhookBaseUrl: true, messagesRetentionDays: true,
});
/**
 * Регистрирует новые read-only маршруты настроек и карточки пользователя.
 * @param registry - Реестр документации.
 * @param security - Авторизация проекта.
 * @returns Ничего.
 */
export function registerUserSettingsReadPaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  const errors = {
    400: { description: 'Некорректные параметры', content: { 'application/json': { schema: MessageErrorSchema } } },
    401: { description: 'Нет авторизации', content: { 'application/json': { schema: UnauthorizedSchema } } },
    403: { description: 'Нет доступа к проекту', content: { 'application/json': { schema: MessageErrorSchema } } },
    404: { description: 'Бот или пользователь не найдены', content: { 'application/json': { schema: MessageErrorSchema } } },
    500: { description: 'Не удалось прочитать данные', content: { 'application/json': { schema: MessageErrorSchema } } },
  };
  registry.registerPath({ method: 'get', path: '/api/projects/{id}/tokens/{tokenId}/settings', tags: ['project-tokens'], security,
    summary: 'Безопасные настройки бота без токена и ENV', request: { params: z.object({ /** Проект. */ id: z.string(), /** Бот. */ tokenId: z.string() }) },
    responses: { 200: { description: 'Настройки существующего бота проекта', content: { 'application/json': { schema: settings } } }, ...errors },
  });
  registry.registerPath({ method: 'get', path: '/api/projects/{projectId}/users/{userId}', tags: ['project-users'], security,
    summary: 'Прочитать пользователя и сохранённые ответы выбранного бота', request: {
      params: z.object({ /** Проект. */ projectId: z.string(), /** Telegram ID человека. */ userId: z.string().regex(/^[1-9]\d{0,19}$/) }),
      query: z.object({ /** Бот, без параметра выбирается бот проекта. */ tokenId: z.string().optional() }),
    }, responses: { 200: { description: 'Пользователь с JSON userData', content: { 'application/json': { schema: z.object({
      /** Telegram ID. */ userId: z.string(), /** Username. */ userName: z.string().nullable(),
      /** Имя. */ firstName: z.string().nullable(), /** Фамилия. */ lastName: z.string().nullable(),
      /** Произвольные сохранённые ответы сценария. */ userData: z.record(z.string(), z.unknown()).nullable(),
      /** Активность 0/1. */ isActive: z.number().nullable(), /** Регистрация. */ registeredAt: z.string().nullable(),
      /** Последнее взаимодействие. */ lastInteraction: z.string().nullable(), /** Число взаимодействий. */ interactionCount: z.number().nullable(),
      /** Проект. */ projectId: z.number(), /** Бот. */ tokenId: z.number(),
    }) } } }, ...errors },
  });
}
