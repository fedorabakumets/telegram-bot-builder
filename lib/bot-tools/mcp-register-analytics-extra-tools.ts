/** @fileoverview Дополнительные действия аналитики через авторизованные HTTP-маршруты. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { linkBudgetInput } from '../../shared/analytics/acquisition/link-budget';
import { analyticsMcpResult, requestAnalyticsV2 } from './analytics-v2-api';
/** Идентификатор доступного проекта. */
const projectId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
/**
 * Добавляет бюджет метки и отдельные рейтинги активности.
 * @param server - MCP-сервер обоих транспортов.
 * @returns Ничего.
 */
export function registerAnalyticsExtraTools(server: McpServer): void {
  server.registerTool('db_save_analytics_link_budget', {
    description: 'Сохранить бюджет простой start-метки одной транзакцией. requestId — постоянный UUID одной оплаты: при повторной доставке используйте тот же UUID и тело, сервер вернёт исходный расход; иное тело с тем же UUID даст 409. Квитанции хранятся до удаления проекта. Для новой оплаты создайте новый UUID. Не отправляет сообщения.',
    inputSchema: { project_id: projectId, data: linkBudgetInput.extend({ requestId: z.string().uuid() }) },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    _meta: { botcraft: { section: 'analytics', effect: 'write' } },
  }, async ({ project_id, data }) => analyticsMcpResult(await requestAnalyticsV2({ projectId: project_id, endpoint: 'acquisition/budgets', method: 'POST', body: data })));
  server.registerTool('db_get_activity_leaders', {
    description: 'Получить рейтинги активности пользователей и групп из API. granularity: 1m=час, 5m=3 часа, 1h=сутки, 1w=7 дней, 1d=30 дней, 7d=84 дня, 30d=365 дней. Без token_id — проект целиком.',
    inputSchema: { project_id: projectId, token_id: projectId.optional(), granularity: z.enum(['1m', '5m', '1h', '1w', '1d', '7d', '30d']).optional() },
    annotations: { readOnlyHint: true },
    _meta: { botcraft: { section: 'analytics', effect: 'read' } },
  }, async ({ project_id, token_id, granularity }) => analyticsMcpResult(await requestAnalyticsV2({ projectId: project_id, endpoint: 'activity-leaders', query: { tokenId: token_id, granularity } })));
}
