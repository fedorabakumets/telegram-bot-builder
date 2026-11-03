/** @fileoverview Проверки точного соответствия MCP, HTTP API и экспортируемых OpenAPI-контрактов v2. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registerAnalyticsV2Tools } from './mcp-register-analytics-v2-tools';
import { registerAnalyticsV2Paths } from '../../server/swagger/paths/analytics-v2-paths';
import { requestAnalyticsV2 } from './analytics-v2-api';

afterEach(() => vi.unstubAllGlobals());
/** Создаёт настоящий MCP SDK-клиент с новыми инструментами без сети и SQL. */
async function withClient(run: (client: Client) => Promise<void>) {
  const server = new McpServer({ name: 'analytics-test', version: '2' });
  registerAnalyticsV2Tools(server);
  const client = new Client({ name: 'test', version: '2' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  try { await server.connect(st); await client.connect(ct); await run(client); }
  finally { await client.close(); await server.close(); }
}

describe('Единый API/MCP контракт аналитики', () => {
  it('возвращает снимок API без пересчёта, потери revision и ограничений истории', async () => {
    const snapshot = { schema_version: 2, revision: '9007199254740993', as_of: '2026-11-02T00:00:00Z', coverage: { status: 'partial' }, previous: null, current: { audience: { new_users: 0, restored_users: 17, first_history_status: 'partial', unknown_first_users: 29 } }, points: [{ date: '2026-11-01T00:00:00Z', new_users: 0, restored_users: 17 }] };
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json(snapshot)); vi.stubGlobal('fetch', fetch);
    await withClient(async client => {
      const result = await client.callTool({ name: 'db_get_analytics_v2', arguments: { project_id: 12, token_id: 3, period: 'all', timezone: 'Europe/Moscow' } });
      expect(JSON.parse((result.content as Array<{ text: string }>)[0].text)).toEqual(snapshot);
      const url = new URL(String(fetch.mock.calls[0][0]));
      expect(url.pathname).toBe('/api/projects/12/analytics/v2/snapshot');
      expect(Object.fromEntries(url.searchParams)).toEqual({ tokenId: '3', period: 'all', timezone: 'Europe/Moscow' });
    });
  });
  it('сохраняет денежные строки в HTTP, результат распределения и null цены', async () => {
    const report = { asOf: '2026-11-02T00:00:00Z', rows: [{ convertedSpend: null, costPerUser: null, costPerUserByCurrency: { RUB: null, USD: '2.50' }, reason: 'Не указан курс' }] };
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json(report)); vi.stubGlobal('fetch', fetch);
    await withClient(async client => {
      const result = await client.callTool({ name: 'db_get_acquisition_report', arguments: { project_id: 12, currency: 'USD' } });
      expect(JSON.parse((result.content as Array<{ text: string }>)[0].text)).toEqual(report);
      await client.callTool({ name: 'db_create_analytics_expense', arguments: { project_id: 12, data: { placementId: 4, amount: '3000.00', currency: 'RUB', day: '2026-11-01', allocation: 'equal', untilDay: '2026-11-02', exchangeRateRubPerUsd: '95.12345678' } } });
      const call = fetch.mock.calls[1] as unknown as [string, RequestInit];
      expect(call[0]).toContain('/analytics/acquisition/expenses');
      expect(call[1].method).toBe('POST');
      expect(JSON.parse(String(call[1].body))).toMatchObject({ amount: '3000.00', exchangeRateRubPerUsd: '95.12345678', allocation: 'equal' });
    });
  });
  it('передаёт архивирование и безопасный отказ, ограничивает путь адаптера', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('secret-database-details', { status: 403 })); vi.stubGlobal('fetch', fetch);
    await withClient(async client => {
      const names = (await client.listTools()).tools.map(tool => tool.name);
      expect(names.sort()).toEqual([
        'db_get_analytics_exchange_rate', 'db_get_analytics_history', 'db_get_analytics_v2', 'db_get_acquisition_report',
        ...['source', 'placement', 'link', 'expense'].flatMap(resource => [`db_create_analytics_${resource}`, `db_update_analytics_${resource}`, `db_list_analytics_${resource}s`]),
      ].sort());
      const result = await client.callTool({ name: 'db_update_analytics_link', arguments: { project_id: 12, resource_id: 5, data: { archived: true } } });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result)).not.toContain('secret-database-details');
      expect(fetch.mock.calls[0][0]).toContain('/acquisition/links/5');
    });
    await requestAnalyticsV2({ projectId: 12, endpoint: '../tokens' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('экспортирует все пути, денежные строки, снимок и одинаковые ограничения записи', () => {
    const registry = new OpenAPIRegistry(); registerAnalyticsV2Paths(registry, [{ agentToken: [] }]);
    const spec = new OpenApiGeneratorV3(registry.definitions).generateDocument({ openapi: '3.0.3', info: { title: 'analytics', version: '2' } });
    expect(Object.keys(spec.paths)).toHaveLength(17);
    expect(spec.paths['/api/projects/{id}/analytics/acquisition/budgets']?.post).toBeDefined();
    expect(spec.paths['/api/projects/{id}/analytics/acquisition/exchange-rate']?.get).toBeDefined();
    expect(spec.paths['/api/projects/{id}/analytics/v2/snapshot']?.get?.responses['200']).toBeDefined();
    const serialized = JSON.stringify(spec);
    expect(serialized).toContain('AnalyticsV2Snapshot');
    expect(serialized).toContain('restored_users');
    expect(serialized).toContain('first_history_status');
    expect(serialized).toContain('exchangeRateRubPerUsd');
    expect(serialized).toContain('costPerUser');
    expect(serialized).toContain('costPerUserByCurrency');
    expect(serialized).toContain('nullable');
  });
});
