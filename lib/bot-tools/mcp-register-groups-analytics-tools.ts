/**
 * @fileoverview Регистрация инструментов чтения групп выбранного бота.
 * @module lib/bot-tools/mcp-register-groups-analytics-tools
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getGroupsChartInDb, getGroupsSummaryInDb } from './groups-analytics-db.ts';
import { USERS_ANALYTICS_PERIODS } from './users-analytics-types.ts';

/**
 * Регистрирует сводку и график групп. Бот обязателен.
 * @param server - Общий сервер MCP
 * @returns Ничего
 */
export function registerGroupsAnalyticsTools(server: McpServer): void {
  /** Преобразует результат чтения в текстовый ответ MCP. */
  const result = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    ...(value && typeof value === 'object' && 'error' in value ? { isError: true } : {}) });
  /** Проект и бот, без которого группы не читаются. */
  const identity = {
    project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  };
  server.registerTool('db_get_groups_summary', {
    description: 'Текущие числа карточки «Группы» одного бота: всего, доступны и исключили. token_id обязателен, группы разных ботов не смешиваются. Каналы не входят.',
    inputSchema: identity,
  }, async ({ project_id, token_id }) => result(await getGroupsSummaryInDb(project_id, { tokenId: token_id })));
  server.registerTool('db_get_groups_chart', {
    description: 'Точки карточки «Группы»: когда панель впервые сохранила группу. Периоды как у пользователей, по умолчанию 30d. mode period — новые группы по слотам, cumulative — накопление до текущего числа. token_id обязателен.',
    inputSchema: { ...identity, period: z.enum(USERS_ANALYTICS_PERIODS).optional(), mode: z.enum(['period', 'cumulative']).optional() },
  }, async ({ project_id, token_id, ...options }) => result(await getGroupsChartInDb(project_id, { ...options, tokenId: token_id })));
}
