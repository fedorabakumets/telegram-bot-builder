/**
 * @fileoverview Регистрация инструментов чтения аналитики аудитории для обоих транспортов MCP.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getUsersChartInDb, getUsersSummaryInDb } from './users-analytics-db.ts';
import { USERS_ANALYTICS_PERIODS } from './users-analytics-types.ts';
import { analyticsRangeSchema } from './mcp-register-range-analytics-tools.ts';

/**
 * Регистрирует сводку и график пользователей через авторизованный API приложения.
 * @param server - Общий сервер MCP
 * @returns Ничего
 */
export function registerUsersAnalyticsTools(server: McpServer): void {
  /** Преобразует результат чтения в текстовый ответ MCP. */
  const result = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    ...(value && typeof value === 'object' && 'error' in value ? { isError: true } : {}) });
  /** Общие фильтры проекта, бота и готового периода. */
  const filters = {
    project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    period: z.enum(USERS_ANALYTICS_PERIODS).optional(),
    ...analyticsRangeSchema,
  };
  server.registerTool('db_get_users_summary', {
    description: 'Всего записей пользователей ботов, новые за период и аудитория до периода. Без token_id учитываются все боты; один человек у разных ботов считается несколько раз. Доступ проверяется по проекту. Период по умолчанию 30d.',
    inputSchema: filters,
  }, async ({ project_id, token_id, ...options }) => result(await getUsersSummaryInDb(project_id, { ...options, tokenId: token_id })));
  server.registerTool('db_get_users_chart', {
    description: 'Точки карточки «Всего пользователей». mode: period — регистрации по слотам, cumulative — накопление. group_by: total — общая аудитория, source — источники. Накопление источников начинается с нуля в выбранном периоде. Доступ проверяется API; период по умолчанию 30d.',
    inputSchema: { ...filters, mode: z.enum(['period', 'cumulative']).optional(), group_by: z.enum(['total', 'source']).optional() },
  }, async ({ project_id, token_id, group_by, ...options }) => result(await getUsersChartInDb(project_id,
    { ...options, tokenId: token_id, groupBy: group_by })));
}
