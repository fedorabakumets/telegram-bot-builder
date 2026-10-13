/** @fileoverview Проверки долей источников, динамики, фильтров и безопасных ошибок API. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTrafficSourcesSummaryInDb, getTrafficSourcesChartInDb } from './traffic-sources-db.ts';
import { USERS_ANALYTICS_WINDOWS } from './users-analytics-types.ts';
import { runWithMcpToken } from './mcp-request-context.ts';

/** Точки включают пустой слот и реальный источник с именем Остальные. */
const points = [
  { date: '2026-10-12T00:00:00Z', sources: {} },
  { date: '2026-10-11T00:00:00Z', sources: { direct: 4, campaign: 2, 'Остальные': 1 } },
];
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('MCP_AGENT_TOKEN', 'test-token');
  fetchMock.mockImplementation(async () => Response.json(points));
});
afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Источники трафика', () => {
  it('считает доли всего окна и отделяет остаток от реального источника', async () => {
    expect(await getTrafficSourcesSummaryInDb(289, { topLimit: 1 })).toMatchObject({
      period: '30d', total_users: 7, source_count: 3,
      sources: [{ source: 'direct', count: 4, percentage: 57.1 }], other_count: 3, other_percentage: 42.9,
    });
    expect(await getTrafficSourcesChartInDb(289, { topLimit: 2 })).toMatchObject({ points: [
      { date: '2026-10-11T00:00:00.000Z', total: 7, sources: [{ source: 'direct', count: 4 }, { source: 'campaign', count: 2 }], other_count: 1 },
      { date: '2026-10-12T00:00:00.000Z', total: 0, sources: [{ source: 'direct', count: 0 }, { source: 'campaign', count: 0 }], other_count: 0 },
    ] });
  });
  it('читает всю аудиторию из traffic и нормализует строки PostgreSQL', async () => {
    fetchMock.mockResolvedValue(Response.json({ sources: [
      { param: 'direct', count: '2', percentage: '66.7', private_field: 'secret' },
      { param: 'campaign', count: '1', percentage: '33.3' },
    ], languages: [{ code: 'private' }] }));
    const result = await getTrafficSourcesSummaryInDb(289, { period: 'all', tokenId: 18 });
    expect(result).toMatchObject({ total_users: 3, from: null, granularity: null,
      sources: [{ source: 'direct', count: 2, percentage: 66.7 }, { source: 'campaign', count: 1, percentage: 33.3 }] });
    expect(fetchMock.mock.calls[0][0]).toContain('/users/traffic?tokenId=18');
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(JSON.stringify(result)).not.toContain('private');
  });
  it.each(Object.entries(USERS_ANALYTICS_WINDOWS))('передаёт окно %s, авторизацию и фильтр бота', async (period, window) => {
    await getTrafficSourcesChartInDb(289, { period: period as keyof typeof USERS_ANALYTICS_WINDOWS, tokenId: 18, apiBaseUrl: 'http://test' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(url).searchParams.get('granularity')).toBe(window.granularity);
    expect(new URL(url).searchParams.get('tokenId')).toBe('18');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer test-token');
  });
  it('пустой ряд и пустая аудитория имеют нулевые итоги', async () => {
    fetchMock.mockResolvedValue(Response.json([]));
    expect(await getTrafficSourcesChartInDb(289)).toMatchObject({ total_users: 0, points: [], from: null, other_percentage: 0 });
    fetchMock.mockResolvedValue(Response.json({ sources: [] }));
    expect(await getTrafficSourcesSummaryInDb(289, { period: 'all' })).toMatchObject({ total_users: 0, sources: [] });
  });
  it.each([401, 403, 404])('скрывает тело HTTP %s', async status => {
    fetchMock.mockResolvedValue(new Response('secret', { status }));
    expect(await getTrafficSourcesSummaryInDb(289)).toEqual({ error: `Не удалось получить аналитику: HTTP ${status}` });
  });
  it('скрывает сетевые подробности', async () => {
    fetchMock.mockRejectedValue(new Error('secret-token'));
    expect(await getTrafficSourcesChartInDb(289)).toEqual({ error: 'Не удалось получить аналитику из API приложения' });
  });
  it('использует токен удалённого запроса вместо токена окружения', async () => {
    await runWithMcpToken('request-token', () => getTrafficSourcesSummaryInDb(289));
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer request-token');
  });
  it.each([
    [points[0], points[0]],
    [{ date: 'invalid', sources: {} }],
    [{ date: points[0].date, sources: { bad: -1 } }],
    Array.from({ length: 501 }, () => points[0]),
    [{ date: points[0].date, sources: { ['a'.repeat(257)]: 1 } }],
    [{ date: points[0].date, sources: { huge: Number.MAX_SAFE_INTEGER, overflow: 1 } }],
  ])('отклоняет повреждённые и слишком большие ряды', async raw => {
    fetchMock.mockResolvedValue(Response.json(raw));
    expect(await getTrafficSourcesChartInDb(289)).toHaveProperty('error');
  });
  it('не обращается к API при недопустимых фильтрах', async () => {
    expect(await getTrafficSourcesSummaryInDb(0)).toHaveProperty('error');
    expect(await getTrafficSourcesChartInDb(289, { period: 'all' })).toHaveProperty('error');
    expect(await getTrafficSourcesSummaryInDb(289, { topLimit: 21 })).toHaveProperty('error');
    expect(await getTrafficSourcesChartInDb(289, { tokenId: -1 })).toHaveProperty('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(['2x', '-1', '9007199254740992'])('отклоняет некорректный счётчик всей аудитории %s', async count => {
    fetchMock.mockResolvedValue(Response.json({ sources: [{ param: 'direct', count }] }));
    expect(await getTrafficSourcesSummaryInDb(289, { period: 'all' })).toHaveProperty('error');
  });
});
