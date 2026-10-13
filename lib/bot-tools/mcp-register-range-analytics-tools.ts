/** @fileoverview MCP точных дат, независимого шага и сравнения временных метрик. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAnalyticsRangeInDb } from './analytics-range-db.ts';
import { USERS_ANALYTICS_PERIODS } from './users-analytics-types.ts';
/** Общие параметры дат и шага для существующих инструментов. */
export const analyticsRangeSchema = {
  from: z.string().max(40).optional().describe('Включённая ISO-дата с часовым поясом; требует to, исключает period.'),
  to: z.string().max(40).optional().describe('Исключённая ISO-дата с часовым поясом.'),
  step: z.enum(['1m', '5m', '1h', '1d', '7d', '30d']).optional().describe('Независимый фиксированный шаг; 30d — 30 суток, до 500 точек.'),
};
/**
 * Регистрирует единый диапазон и сравнение с предыдущим либо явным окном.
 * @param server - Сервер обоих транспортов MCP.
 * @returns Ничего.
 */
export function registerRangeAnalyticsTools(server: McpServer): void {
  const filters = { project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    metric: z.enum(['registrations', 'messages', 'active_users']),
    period: z.enum(USERS_ANALYTICS_PERIODS).optional(), ...analyticsRangeSchema };
  /** Выполняет запрос и помечает безопасные ошибки. */
  const handle = async ({ project_id, token_id, ...options }: z.infer<z.ZodObject<typeof filters>> & { comparison?: 'previous' | 'explicit'; compare_from?: string; compare_to?: string }) => {
    const value = await getAnalyticsRangeInDb(project_id, { ...options, tokenId: token_id });
    return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], ...('error' in value ? { isError: true } : {}) };
  };
  server.registerTool('db_get_analytics_range', { inputSchema: filters,
    description: 'Точные UTC [from,to) и независимый шаг для registrations/messages/active_users; period либо from+to. 12w=84 дня,12m=365. Итоги active_users уникальны. Дневные агрегаты только для границ в полночь и шагов от суток; иначе сохранённые сообщения с ограничениями очистки.' }, handle);
  server.registerTool('db_compare_analytics', { inputSchema: { ...filters,
    comparison: z.enum(['previous', 'explicit']).default('previous'), compare_from: z.string().max(40).optional(), compare_to: z.string().max(40).optional() },
    description: 'Сравнивает временные метрики в одном снимке БД. previous — предыдущее окно той же длительности; explicit — compare_from/compare_to. Один источник обоих окон. absolute_change и percent_change; при нулевой базе и ненулевом результате процент null. Premium и языки не являются историческими метриками.' }, handle);
}
