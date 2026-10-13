/**
 * @fileoverview Регистрация сводки и графика активных пользователей в обоих транспортах MCP.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { USERS_ANALYTICS_PERIODS } from './users-analytics-types.ts';
import { analyticsRangeSchema } from './mcp-register-range-analytics-tools.ts';
import { getActiveUsersChartInDb, getActiveUsersSummaryInDb } from './active-users-analytics-db.ts';

/**
 * Регистрирует инструменты уникальной активности без ошибочного накопления.
 * @param server - Сервер MCP.
 * @returns Ничего.
 */
export function registerActiveUsersTools(server: McpServer): void {
  /** Преобразует результат и помечает ошибки чтения API. */
  const result = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    ...(value && typeof value === 'object' && 'error' in value ? { isError: true } : {}) });
  /** Общие фильтры доступа и периода. */
  const filters = {
    project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    period: z.enum(USERS_ANALYTICS_PERIODS).optional(),
    ...analyticsRangeSchema,
  };
  server.registerTool('db_get_active_users_summary', {
    description: 'Уникальные активные пользователи, новички и вернувшиеся за окно. Один user_id у нескольких ботов считается один раз. Итоги не суммируются по дням. Период по умолчанию 30d; 12w — 84 дня. Доступ проверяется API проекта.',
    inputSchema: filters,
  }, async ({ project_id, token_id, ...options }) => result(await getActiveUsersSummaryInDb(project_id, { ...options, tokenId: token_id })));
  server.registerTool('db_get_active_users_chart', {
    description: 'Карточка «Активные пользователи»: split total — общий ряд, cohort — новички и вернувшиеся по слотам. До 500 точек. Итоги окна уникальны и не равны сумме точек. Накопление не поддерживается. Без token_id все боты проекта.',
    inputSchema: { ...filters, split: z.enum(['total', 'cohort']).optional() },
  }, async ({ project_id, token_id, ...options }) => result(await getActiveUsersChartInDb(project_id, { ...options, tokenId: token_id })));
}
