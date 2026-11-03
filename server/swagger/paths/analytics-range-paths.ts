/** @fileoverview Документация существующего API точных диапазонов и рейтингов активности. */
import '../schemas/common';
import { z } from 'zod';
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { AnalyticsRangeResponseSchema, ActivityLeadersResponseSchema } from '../schemas/analytics-range';
import { MessageErrorSchema, UnauthorizedSchema } from '../schemas/common';

/**
 * Описывает дополнительные API чтения аналитики без импорта их выполнения.
 * @param registry - Реестр контрактов.
 * @param security - Авторизация проекта.
 * @returns Ничего.
 */
export function registerAnalyticsRangePaths(registry: OpenAPIRegistry, security: Array<Record<string, string[]>>): void {
  const params = z.object({ /** Проект. */ id: z.string() });
  const errors = {
    400: { description: 'Некорректный диапазон, метрика или бот', content: { 'application/json': { schema: MessageErrorSchema } } },
    401: { description: 'Нет авторизации', content: { 'application/json': { schema: UnauthorizedSchema } } },
    403: { description: 'Нет доступа к проекту или боту', content: { 'application/json': { schema: MessageErrorSchema } } },
    500: { description: 'Ошибка чтения', content: { 'application/json': { schema: MessageErrorSchema } } },
    503: { description: 'База недоступна', content: { 'application/json': { schema: MessageErrorSchema } } },
  };
  registry.registerPath({ method: 'get', path: '/api/projects/{id}/analytics/range', tags: ['analytics-v2'], security,
    summary: 'Точные диапазоны и сравнение метрик', description: 'До 365 дней и 500 точек. period исключает from/to; comparison=explicit требует compare_from/compare_to.',
    request: { params, query: z.object({
      /** Метрика. */ metric: z.enum(['registrations', 'messages', 'active_users']),
      /** Бот. */ tokenId: z.string().optional(), /** Готовый период. */ period: z.enum(['1h', '3h', '24h', '7d', '30d', '12w', '12m']).optional(),
      /** Включённая граница. */ from: z.string().optional(), /** Исключённая граница. */ to: z.string().optional(),
      /** Шаг. */ step: z.enum(['1m', '5m', '1h', '1d', '7d', '30d']).optional(),
      /** Режим сравнения. */ comparison: z.enum(['previous', 'explicit']).optional(),
      /** Начало сравнения. */ compare_from: z.string().optional(), /** Конец сравнения. */ compare_to: z.string().optional(),
    }) }, responses: { 200: { description: 'Диапазоны и изменение итогов', content: { 'application/json': { schema: AnalyticsRangeResponseSchema } } }, ...errors },
  });
  registry.registerPath({ method: 'get', path: '/api/projects/{id}/analytics/activity-leaders', tags: ['analytics-v2'], security,
    summary: 'Топ десять пользователей и групп по активности', request: { params, query: z.object({
      /** Бот. */ tokenId: z.string().optional(), /** Период рейтинга по конфигурации графиков. */ granularity: z.string().optional(),
    }) }, responses: { 200: { description: 'Рейтинги', content: { 'application/json': { schema: ActivityLeadersResponseSchema } } }, ...errors },
  });
}
