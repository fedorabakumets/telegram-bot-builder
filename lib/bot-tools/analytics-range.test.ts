/** @fileoverview Проверки UTC-границ, нулевой базы, протокола и безопасного доступа. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { Pool } from 'pg';
import { resolveAnalyticsRange, analyticsChange } from '../../shared/analytics/range.ts';
import { supportsDailyRange } from '../../server/routes/analytics/query-range.ts';
import { setupAnalyticsRangeRoutes } from '../../server/routes/analytics/setup-range-routes.ts';
import { createBotcraftMcpServer } from './mcp-register-tools.ts';
import { getUsersChartInDb } from './users-analytics-db.ts';
const now = Date.parse('2026-10-13T12:00:00Z');
afterEach(() => vi.unstubAllGlobals());
describe('Точные временные диапазоны', () => {
  it('использует ровно 84 дня и независимый шаг', () => {
    const range = resolveAnalyticsRange({ period: '12w', step: '1d' }, now);
    expect(range.duration_ms).toBe(84 * 86400000);
    expect(range.step).toBe('1d');
    expect(range.to).toBe('2026-10-13T12:00:00.000Z');
    expect(range.boundary).toBe('[from,to)');
  });
  it('нормализует смещение в UTC и ограничивает число точек', () => {
    expect(resolveAnalyticsRange({ from: '2026-10-01T03:00:00+03:00', to: '2026-10-02T00:00:00Z' }, now).from).toBe('2026-10-01T00:00:00.000Z');
    expect(() => resolveAnalyticsRange({ period: '12m', step: '1m' }, now)).toThrow('500');
  });
  it.each([
    { from: '', to: '' }, { from: '2026-02-30T00:00:00Z', to: '2026-03-03T00:00:00Z' },
    { period: '__proto__' }, { step: 'constructor' }, { from: ['2026-10-01T00:00:00Z'], to: '2026-10-02T00:00:00Z' },
    { from: '2026-10-01T00:00:00', to: '2026-10-02T00:00:00Z' },
    { period: '30d', from: '2026-10-01T00:00:00Z', to: '2026-10-02T00:00:00Z' },
    { from: '2026-10-02T00:00:00Z' }, { from: '2026-10-03T00:00:00Z', to: '2026-10-02T00:00:00Z' },
    { from: '2026-10-01T00:00:00Z', to: '2026-10-14T00:00:00Z' },
  ])('отклоняет некорректные параметры %j', options => expect(() => resolveAnalyticsRange(options as never, now)).toThrow());
  it('выбирает дневной источник только для точных полуночных границ', () => {
    expect(supportsDailyRange(resolveAnalyticsRange({ from: '2026-10-01T00:00:00Z', to: '2026-10-03T00:00:00Z', step: '1d' }, now))).toBe(true);
    expect(supportsDailyRange(resolveAnalyticsRange({ from: '2026-10-01T01:00:00Z', to: '2026-10-03T00:00:00Z', step: '1d' }, now))).toBe(false);
    expect(supportsDailyRange(resolveAnalyticsRange({ from: '2026-10-01T00:00:00Z', to: '2026-10-03T00:00:00Z', step: '1h' }, now))).toBe(false);
  });
  it('возвращает null вместо бесконечного процента при нулевой базе', () => {
    expect(analyticsChange(2, 0)).toEqual({ current: 2, previous: 0, absolute_change: 2, percent_change: null });
    expect(analyticsChange(0, 0).percent_change).toBe(0);
    expect(analyticsChange(15, 10).percent_change).toBe(50);
  });
  it('не открывает соединение БД при отказе доступа', async () => {
    const app = express();
    const connect = vi.fn();
    setupAnalyticsRangeRoutes(app, { connect } as unknown as Pool, (_req, res) => { res.status(403).json({ message: 'Нет доступа' }); });
    const server = app.listen(0);
    try {
      const address = server.address() as { port: number };
      expect((await fetch(`http://127.0.0.1:${address.port}/api/projects/289/analytics/range?metric=active_users`)).status).toBe(403);
      expect(connect).not.toHaveBeenCalled();
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  });
  it('передаёт from/to/step существующего графика и накапливает внутри окна', async () => {
    const mock = vi.fn(async () => Response.json({ current: { summary: { count: 2, incoming: 0, outgoing: 0, newcomers: 0 }, points: [
      { date: '2026-10-01T00:00:00Z', count: 2 }, { date: '2026-10-02T00:00:00Z', count: 0 },
    ] } }));
    vi.stubGlobal('fetch', mock);
    const result = await getUsersChartInDb(289, { from: '2026-10-01T00:00:00Z', to: '2026-10-03T00:00:00Z', step: '1d', mode: 'cumulative' });
    expect(result).toMatchObject({ new_users: 2, accumulation_scope: 'selected_period', points: [{ count: 2 }, { count: 2 }] });
    expect(String(mock.mock.calls[0][0])).toContain('/analytics/range?');
  });
  it('доставляет сравнение и безопасный отказ через MCP SDK', async () => {
    const mock = vi.fn(async () => Response.json({ current: { points: [], summary: { count: 1 } }, previous: { points: [], summary: { count: 0 } }, change: { count: analyticsChange(1, 0) } }));
    vi.stubGlobal('fetch', mock);
    const server = createBotcraftMcpServer({ enableFileTools: false });
    const client = new Client({ name: 'range-test', version: '1.0.0' });
    const [ct, st] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(st); await client.connect(ct);
      expect((await client.listTools()).tools.map(item => item.name)).toEqual(expect.arrayContaining(['db_compare_analytics', 'db_get_analytics_range']));
      const result = await client.callTool({ name: 'db_compare_analytics', arguments: { project_id: 289, metric: 'active_users', period: '7d' } });
      expect(JSON.stringify(result)).toContain('percent_change');
      expect(String(mock.mock.calls[0][0])).toContain('comparison=previous');
      mock.mockImplementation(async () => new Response('secret', { status: 403 }));
      const denied = await client.callTool({ name: 'db_get_analytics_range', arguments: { project_id: 289, metric: 'messages' } });
      expect(denied.isError).toBe(true); expect(JSON.stringify(denied)).not.toContain('secret');
    } finally { await client.close(); await server.close(); }
  });
});
