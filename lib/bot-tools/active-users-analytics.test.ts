/** @fileoverview Проверки уникальных итогов, временных рядов и доступа к активности пользователей. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getActiveUsersChartInDb, getActiveUsersSummaryInDb } from './active-users-analytics-db.ts';

/** Один человек активен в двух слотах: итог окна остаётся единицей. */
const activity = {
  activeInWindow: 1, newInWindow: 1, points: [
    { date: '2026-10-11T00:00:00Z', total: 1, newcomers: 1, returning: 0 },
    { date: '2026-10-12T00:00:00Z', total: 1, newcomers: 0, returning: 1 },
  ],
};
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('MCP_AGENT_TOKEN', 'test-token');
  fetchMock.mockImplementation(async () => Response.json(activity));
});
afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Активные пользователи через MCP', () => {
  it('использует уникальные итоги API вместо суммы дневных точек', async () => {
    const summary = await getActiveUsersSummaryInDb(289);
    expect(summary).toMatchObject({ active_users: 1, newcomers: 1, returning: 0 });
    const chart = await getActiveUsersChartInDb(289, { split: 'cohort' });
    expect(chart).toMatchObject({ active_users: 1, points: [
      { date: '2026-10-11T00:00:00.000Z', total: 1, newcomers: 1, returning: 0 },
      { date: '2026-10-12T00:00:00.000Z', total: 1, newcomers: 0, returning: 1 },
    ] });
  });
  it('возвращает общий ряд и передаёт авторизацию и фильтры', async () => {
    expect(await getActiveUsersChartInDb(289, { period: '3h', tokenId: 18, apiBaseUrl: 'http://test' }))
      .toMatchObject({ activity_source: 'bot_messages', points: [
        { date: '2026-10-11T00:00:00.000Z', count: 1 }, { date: '2026-10-12T00:00:00.000Z', count: 1 },
      ] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(new URL(url).searchParams.get('granularity')).toBe('5m');
    expect(new URL(url).searchParams.get('tokenId')).toBe('18');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer test-token');
  });
  it('описывает дневные отметки и фактическое окно 91 день', async () => {
    expect(await getActiveUsersSummaryInDb(289, { period: '12w' })).toMatchObject({
      window_days: 91, activity_source: 'user_activity_daily', bucket_timezone: 'UTC',
    });
  });
  it('сохраняет пустое окно без выдуманных точек', async () => {
    fetchMock.mockResolvedValue(Response.json({ activeInWindow: 0, newInWindow: 0, points: [] }));
    expect(await getActiveUsersChartInDb(289)).toMatchObject({ active_users: 0, returning: 0, from: null, to: null, points: [] });
  });
  it.each([401, 403, 404])('скрывает тело ошибки HTTP %s', async status => {
    fetchMock.mockResolvedValue(new Response('secret-data', { status }));
    const result = await getActiveUsersSummaryInDb(289);
    expect(result).toHaveProperty('error', expect.stringContaining(String(status)));
    expect(JSON.stringify(result)).not.toContain('secret-data');
  });
  it('скрывает подробности сетевой ошибки', async () => {
    fetchMock.mockRejectedValue(new Error('secret-network'));
    expect(await getActiveUsersChartInDb(289)).toHaveProperty('error');
    expect(JSON.stringify(await getActiveUsersChartInDb(289))).not.toContain('secret-network');
  });
  it.each([
    { ...activity, newInWindow: 2 },
    { ...activity, points: [{ ...activity.points[0], returning: 2 }] },
    { ...activity, points: [activity.points[0], activity.points[0]] },
    { ...activity, points: [{ ...activity.points[0], date: 'invalid' }] },
    { ...activity, points: Array.from({ length: 501 }, () => activity.points[0]) },
  ])('отклоняет повреждённые данные и превышение лимита', async raw => {
    fetchMock.mockResolvedValue(Response.json(raw));
    expect(await getActiveUsersChartInDb(289)).toHaveProperty('error');
  });
  it('отклоняет неверные фильтры до обращения к API', async () => {
    expect(await getActiveUsersSummaryInDb(0)).toHaveProperty('error');
    expect(await getActiveUsersChartInDb(289, { tokenId: -1 })).toHaveProperty('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
