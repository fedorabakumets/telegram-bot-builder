/** @fileoverview Регистрация MCP-сводки и графика источников трафика для обоих транспортов. */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { USERS_ANALYTICS_PERIODS } from './users-analytics-types.ts';
import { getTrafficSourcesSummaryInDb, getTrafficSourcesChartInDb } from './traffic-sources-db.ts';

/**
 * Регистрирует ограниченные инструменты карточек источников трафика.
 * @param server - Сервер MCP.
 * @returns Ничего.
 */
export function registerTrafficSourcesTools(server: McpServer): void {
  /** Упаковывает результат и помечает безопасную ошибку API. */
  const result = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    ...(value && typeof value === 'object' && 'error' in value ? { isError: true } : {}) });
  /** Общие фильтры проекта, бота и числа отдельных источников. */
  const filters = {
    project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    top_limit: z.number().int().min(1).max(20).optional(),
  };
  server.registerTool('db_get_traffic_sources_summary', {
    description: 'Доли источников трафика по записям bot_users: period all — текущая аудитория, остальные периоды — регистрации за окно. По умолчанию 30d, top_limit 10; остальные в other_count. Это не уникальные люди проекта и не переходы по ссылкам. API проверяет доступ.',
    inputSchema: { ...filters, period: z.enum([...USERS_ANALYTICS_PERIODS, 'all']).optional() },
  }, async ({ project_id, token_id, top_limit, period }) => result(await getTrafficSourcesSummaryInDb(project_id,
    { tokenId: token_id, topLimit: top_limit, period })));
  server.registerTool('db_get_traffic_sources_chart', {
    description: 'Динамика регистраций по текущему параметру источника. До 500 слотов и 20 отдельных источников; остальные в other_count. По умолчанию 30d, топ-10. Накопления и all нет. Без token_id все боты проекта. 12w — 84 дня, как в карточке источников.',
    inputSchema: { ...filters, period: z.enum(USERS_ANALYTICS_PERIODS).optional() },
  }, async ({ project_id, token_id, top_limit, period }) => result(await getTrafficSourcesChartInDb(project_id,
    { tokenId: token_id, topLimit: top_limit, period })));
}
