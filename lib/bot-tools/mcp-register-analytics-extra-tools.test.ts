/** @fileoverview Проверки маршрутизации новых действий аналитики и явной неидемпотентности бюджета. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAnalyticsExtraTools } from './mcp-register-analytics-extra-tools';
import { requestAnalyticsV2 } from './analytics-v2-api';
afterEach(() => vi.unstubAllGlobals());
describe('Дополнительная аналитика MCP', () => {
  it('передаёт бюджет с постоянным ключом без преобразования денежных строк', async () => {
    const definitions = new Map<string, any>(); const calls = new Map<string, any>();
    registerAnalyticsExtraTools({ registerTool: (name: string, config: any, callback: any) => { definitions.set(name, config); calls.set(name, callback); } } as unknown as McpServer);
    const fetch = vi.fn(async () => Response.json({ item: { id: 55, amount: '10.00' } }, { status: 201 })); vi.stubGlobal('fetch', fetch);
    const data = { requestId: '313c936b-d07a-40b8-b07f-c3bb17249516', tokenId: 3, marker: 'promo', amount: '10.00', currency: 'RUB', day: '2026-11-01', timezone: 'Europe/Moscow' };
    const result = await calls.get('db_save_analytics_link_budget')({ project_id: 7, data });
    expect(result.isError).not.toBe(true); expect(JSON.parse(result.content[0].text).item.id).toBe(55);
    expect(definitions.get('db_save_analytics_link_budget').annotations.idempotentHint).toBe(true);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/analytics/acquisition/budgets'); expect(init.method).toBe('POST'); expect(JSON.parse(String(init.body))).toEqual(data);
    await calls.get('db_get_activity_leaders')({ project_id: 7, token_id: 3, granularity: '1w' });
    expect(String((fetch.mock.calls[1] as unknown as [string])[0])).toContain('/analytics/activity-leaders?tokenId=3&granularity=1w');
  });
  it('разрешает курс, но не произвольный путь; отказ API остаётся ошибкой', async () => {
    const fetch = vi.fn(async () => new Response('secret', { status: 403 })); vi.stubGlobal('fetch', fetch);
    expect(await requestAnalyticsV2({ projectId: 7, endpoint: 'acquisition/exchange-rate', query: { day: '2026-11-01' } })).toEqual({ error: 'API аналитики недоступен: HTTP 403', status: 403 });
    expect(await requestAnalyticsV2({ projectId: 7, endpoint: '../tokens' })).toEqual({ error: 'Неизвестный ресурс аналитики' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
