/**
 * @fileoverview Регистрация сводки и графика активности сообщений для обоих транспортов MCP.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getMessagesChartInDb, getMessagesSummaryInDb } from './messages-analytics-db.ts';
import { MESSAGES_ANALYTICS_PERIODS } from './messages-analytics-types.ts';
import { analyticsRangeSchema } from './mcp-register-range-analytics-tools.ts';

/**
 * Регистрирует инструменты активности через авторизованный API приложения.
 * @param server - Общий сервер MCP.
 * @returns Ничего.
 */
export function registerMessagesAnalyticsTools(server: McpServer): void {
  /** Формирует текстовый ответ и отмечает безопасные ошибки API. */
  const result = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    ...(value && typeof value === 'object' && 'error' in value ? { isError: true } : {}) });
  /** Общие фильтры проекта, бота и периода. */
  const filters = {
    project_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    token_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
    period: z.enum(MESSAGES_ANALYTICS_PERIODS).optional(),
    ...analyticsRangeSchema,
  };
  server.registerTool('db_get_messages_summary', {
    description: 'Сводка активности сообщений: сохранённая история, сообщения за период и направления, среднее сохранённых сообщений на текущую запись bot_users. Очистка влияет на историю и короткие окна; длинные окна используют дневные агрегаты. Без token_id все боты. Период по умолчанию 30d. Доступ проверяется по проекту.',
    inputSchema: filters,
  }, async ({ project_id, token_id, ...options }) => result(await getMessagesSummaryInDb(project_id, { ...options, tokenId: token_id })));
  server.registerTool('db_get_messages_chart', {
    description: 'Точки карточки «Активность сообщений». mode: period или cumulative (накопление от нуля за выбранный период). split: total или direction (incoming — user, outgoing — остальные типы). До 500 точек. 12w — 84 дня; 12m — 365 дней. Авторизация через API проекта.',
    inputSchema: { ...filters, mode: z.enum(['period', 'cumulative']).optional(), split: z.enum(['total', 'direction']).optional() },
  }, async ({ project_id, token_id, ...options }) => result(await getMessagesChartInDb(project_id, { ...options, tokenId: token_id })));
}
