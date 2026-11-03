/** @fileoverview Сводка и динамика групп проекта по существующим SQL-ответам. */
import '../schemas/common';
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { MessageErrorSchema, UnauthorizedSchema } from '../schemas/common';
/**
 * Регистрирует существующие маршруты чтения групп.
 * @param registry - Реестр документации.
 * @param security - Авторизация проекта.
 * @returns Ничего.
 */
export function registerGroupsAnalyticsPaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  const params = z.object({ /** Проект. */ projectId: z.string() });
  const query = z.object({ /** Необязательный бот. */ tokenId: z.string().optional(), /** Период графика. */ granularity: z.string().optional() });
  const errors = {
    401: { description: 'Нет авторизации', content: { 'application/json': { schema: UnauthorizedSchema } } },
    403: { description: 'Нет доступа к проекту', content: { 'application/json': { schema: MessageErrorSchema } } },
  };
  registry.registerPath({ method: 'get', path: '/api/projects/{projectId}/groups/analytics/stats', tags: ['project-groups'], security,
    summary: 'Текущая сводка уникальных групп', request: { params, query }, responses: {
      200: { description: 'Счётчики групп', content: { 'application/json': { schema: z.object({
        /** Всего групп. */ totalGroups: z.number(), /** Доступны. */ availableGroups: z.number(),
        /** Бот исключён. */ kickedGroups: z.number(), /** Добавлено за неделю. */ addedLast7Days: z.number(),
      }) } } }, ...errors,
    },
  });
  registry.registerPath({ method: 'get', path: '/api/projects/{projectId}/groups/analytics/growth', tags: ['project-groups'], security,
    summary: 'Динамика первого сохранения групп', request: { params, query }, responses: {
      200: { description: 'Временной ряд', content: { 'application/json': { schema: z.array(z.object({
        /** Момент UTC. */ date: z.string(), /** Число групп. */ count: z.number(),
      })) } } }, ...errors,
    },
  });
}
