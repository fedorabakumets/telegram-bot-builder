/** @fileoverview Явные контракты небольших маршрутов редактора, файлов и настроек бота. */
import '../schemas/common';
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { MessageErrorSchema, UnauthorizedSchema } from '../schemas/common';
import { PROJECT_TOKEN_SETTINGS_ERRORS } from './project-tokens-settings-errors';

/**
 * Регистрирует проверенные JSON-ответы действующих обработчиков.
 * @param registry - Реестр документации.
 * @param security - Авторизация приложения.
 * @returns Ничего.
 */
export function registerAdditionalRuntimePaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  registry.registerPath({ method: 'get', path: '/api/disabled-node-types', tags: ['config'], security: [],
    summary: 'Типы блоков, отключённые в редакторе', responses: {
      200: { description: 'Список типов', content: { 'application/json': { schema: z.object({ /** Выключенные типы. */ disabled: z.array(z.string()) }) } } },
    },
  });
  registry.registerPath({ method: 'get', path: '/api/projects/{projectId}/messages/{messageId}/file-size', tags: ['project-files'], security,
    summary: 'Уточнить размер медиа сообщения', description: 'Может вызвать Telegram getFile и сохранить размер в истории. null означает отсутствие доступного размера.',
    request: { params: z.object({ /** Проект. */ projectId: z.string(), /** Внутренний ID сообщения. */ messageId: z.string() }) },
    responses: {
      200: { description: 'Размер в байтах либо null', content: { 'application/json': { schema: z.object({ /** Размер. */ fileSize: z.number().nullable() }) } } },
      400: { description: 'Некорректный ID', content: { 'application/json': { schema: MessageErrorSchema } } },
      404: { description: 'Сообщение или бот не найдены', content: { 'application/json': { schema: MessageErrorSchema } } },
      503: { description: 'Telegram временно недоступен', content: { 'application/json': { schema: MessageErrorSchema } } },
      401: { description: 'Нет авторизации', content: { 'application/json': { schema: UnauthorizedSchema } } },
      403: { description: 'Нет доступа к проекту', content: { 'application/json': { schema: MessageErrorSchema } } },
    },
  });
  const flag = z.union([z.literal(0), z.literal(1)]);
  registry.registerPath({ method: 'put', path: '/api/projects/{projectId}/tokens/{tokenId}/track-group-membership', tags: ['project-tokens'], security,
    summary: 'Сохранить слежение за участием бота в группах', description: 'Настройка сохранена, token-updated публикуется отдельно; применение ENV при следующем запуске.',
    request: { params: z.object({ /** Проект. */ projectId: z.string(), /** Бот. */ tokenId: z.string() }),
      body: { content: { 'application/json': { schema: z.object({ /** Включение: 0 или 1. */ trackGroupMembership: flag }) } } } },
    responses: { 200: { description: 'Настройка записана', content: { 'application/json': { schema: z.object({
      /** Успех записи. */ success: z.literal(true), /** Значение. */ trackGroupMembership: flag,
    }) } } }, ...PROJECT_TOKEN_SETTINGS_ERRORS,
      500: { description: 'Ошибка обновления', content: { 'application/json': { schema: MessageErrorSchema } } },
    },
  });
}
