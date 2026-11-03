/** @fileoverview MCP подтверждённой аналитики, рекламных источников, ссылок и расходов через единый API. */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { requestAnalyticsV2, analyticsMcpResult } from './analytics-v2-api.ts';
import { sourceInput, placementInput, linkInput, expenseInput } from '../../shared/analytics/acquisition/validation';
import { placementPatch, expensePatch } from '../../shared/analytics/acquisition/update';
import { reportInput } from '../../shared/analytics/acquisition/report';
/** Проверенная область проекта для каждого вызова. */
const projectId = z.number().int().positive().max(Number.MAX_SAFE_INTEGER).describe('ID проекта с доступом текущего агента.');
/** Общие параметры снимка; сервер проверяет взаимоисключающие варианты периода. */
const snapshotFilters = {
  /** Проект. */ project_id: projectId,
  /** Один бот. */ token_id: z.number().int().positive().optional().describe('Без параметра — весь проект, люди дедуплицируются между ботами.'),
  /** Готовое окно. */ period: z.enum(['1h','3h','24h','7d','30d','12w','12m','all']).optional().describe('Либо period, либо from+to. По умолчанию 30d.'),
  /** Включённая дата. */ from: z.string().datetime({ offset: true }).optional(),
  /** Исключённая дата. */ to: z.string().datetime({ offset: true }).optional(),
  /** Шаг. */ step: z.enum(['1m','5m','1h','1d','7d','30d']).optional(),
  /** Пояс. */ timezone: z.string().optional().describe('IANA, например Europe/Moscow.'),
  /** Сравнение. */ comparison: z.literal('previous').optional(),
};
/** Регистрирует снимок и отчёт; расчёты выполняет только HTTP API приложения. */
export function registerAnalyticsV2Tools(server: McpServer): void {
  server.registerTool('db_get_analytics_exchange_rate', {
    description: 'Получить бесплатный официальный курс USD/RUB Банка России на учётный день. rubPerUsd — рублей за один доллар, effectiveDay — фактическая дата действия. Доступ к проекту обязателен. Не сохраняет и не пересчитывает расходы. Для оплаты передайте рублёвый курс и effectiveDay через exchangeRateRubPerUsd и exchangeRateDate.',
    inputSchema: { project_id: projectId, day: z.string().date().describe('Учётный день YYYY-MM-DD, не позже сегодня.') }, annotations: { readOnlyHint: true },
  }, async ({ project_id, day }) => analyticsMcpResult(await requestAnalyticsV2({ projectId: project_id, endpoint: 'acquisition/exchange-rate', query: { day } })));
  server.registerTool('db_get_analytics_history', {
    description: 'История изменений источника, размещения, ссылки или расхода: автор, время, beforeData/afterData. Доступ проверяется HTTP API внутри проекта.',
    inputSchema: { project_id: projectId, resource: z.enum(['sources','placements','links','expenses']), resource_id: z.number().int().positive() }, annotations: { readOnlyHint: true },
  }, async ({ project_id, resource, resource_id }) => analyticsMcpResult(await requestAnalyticsV2({ projectId: project_id, endpoint: `acquisition/${resource}/${resource_id}/history` })));
  server.registerTool('db_get_analytics_v2', {
    description: 'Согласованный снимок подтверждённой аналитики v2: новые/активные/вернувшиеся, сообщения отдельно от callback и служебных, топы и источники. restored_users — первые сохранённые действия в окне при неизвестной фактической первой дате; это отдельная серия, не новые и не знаменатель CPA. audience.first_history_status описывает полноту окна. unknown_first_users и total_users — всё время. period либо from+to, до 500 точек. Возвращает as_of, revision, coverage и previous. Обычная переписка группы не является использованием бота; неполная история не означает ноль.',
    inputSchema: snapshotFilters, annotations: { readOnlyHint: true },
  }, async ({ project_id, token_id, ...query }) => analyticsMcpResult(await requestAnalyticsV2({ projectId: project_id, endpoint: 'v2/snapshot', query: { ...query, tokenId: token_id } })));
  server.registerTool('db_get_acquisition_report', {
    description: 'Рекламные расходы и результаты размещений из единого API. Без from/to — весь срок. decimal-строки RUB/USD не складываются без ручного RUB-за-USD курса. costPerUser=null и reason объясняют неполную историю, частичный день, неизвестные расходы/курс или отсутствие новых. starts — запуск бота, не клик. includeSources="true" добавляет обнаруженные источники без размещений: placementId=null, стабильный rowKey, расход null.',
    inputSchema: { project_id: projectId, ...reportInput.shape }, annotations: { readOnlyHint: true },
  }, async ({ project_id, ...query }) => analyticsMcpResult(await requestAnalyticsV2({ projectId: project_id, endpoint: 'acquisition/report', query })));
  const resources = {
    sources: { singular: 'source', name: 'источники', input: sourceInput, patch: sourceInput.partial().extend({ archived: z.boolean().optional() }) },
    placements: { singular: 'placement', name: 'размещения', input: placementInput, patch: placementPatch },
    links: { singular: 'link', name: 'ссылки', input: linkInput, patch: z.object({ archived: z.boolean() }).strict() },
    expenses: { singular: 'expense', name: 'расходы', input: expenseInput, patch: expensePatch },
  };
  for (const resource of Object.keys(resources) as Array<keyof typeof resources>) {
    const definition = resources[resource];
    server.registerTool(`db_list_analytics_${resource}`, {
      description: `Получить ${definition.name} проекта, включая архивные. Секретов бота и одноразовых login-кодов в ответе нет.`,
      inputSchema: { project_id: projectId }, annotations: { readOnlyHint: true },
    }, async ({ project_id }) => analyticsMcpResult(await requestAnalyticsV2({ projectId: project_id, endpoint: `acquisition/${resource}` })));
    server.registerTool(`db_create_analytics_${definition.singular}`, {
      description: `Создать: ${definition.name}. data совпадает с POST API. Все связанные ID проверяются в проекте. Ссылки bc_ постоянны; конфликт маршрута /start возвращает 409. Расход amount строкой, allocation=equal явно распределяет по day..untilDay. exchangeRateRubPerUsd — сохранённый ручной курс RUB за 1 USD.`,
      inputSchema: { project_id: projectId, data: definition.input }, annotations: { readOnlyHint: false, destructiveHint: false },
    }, async ({ project_id, data }) => analyticsMcpResult(await requestAnalyticsV2({ projectId: project_id, endpoint: `acquisition/${resource}`, method: 'POST', body: data })));
    server.registerTool(`db_update_analytics_${definition.singular}`, {
      description: `Исправить или архивировать: ${definition.name}. data совпадает с PATCH API; archived=true архивирует, false восстанавливает. Публичная метка и первоначальные связи не меняются; изменения сохраняются в аудите.`,
      inputSchema: { project_id: projectId, resource_id: z.number().int().positive(), data: definition.patch }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    }, async ({ project_id, resource_id, data }) => analyticsMcpResult(await requestAnalyticsV2({ projectId: project_id, endpoint: `acquisition/${resource}/${resource_id}`, method: 'PATCH', body: data })));
  }
}
