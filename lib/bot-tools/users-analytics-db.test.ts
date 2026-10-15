/** @fileoverview Проверки HTTP-запросов, накопления и ошибок инструментов аналитики пользователей. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUsersChartInDb, getUsersSummaryInDb } from './users-analytics-db.ts';

const fetchMock = vi.fn();
/**
 * Подготавливает HTTP-ответы сводки, прироста и необязательного разреза по источникам.
 * @param points - Точки прироста общего ряда
 * @param totalUsers - Общее число записей пользователей
 * @param sources - Точки прироста по источникам
 * @returns Настраивает ответы подменённого HTTP-клиента
 */
/** Текущий снимок мест, блокировки и удалённых в ответе /stats. */
const AUDIENCE = {
  privateUsers: 4, groupUsers: 2, channelUsers: 1, usersInSeveralPlaces: 1,
  blockedBotUsers: 3, deletedUsers: 2,
};

function mockAnalytics(points: unknown[] = [], totalUsers = 0, sources?: unknown[]) {
  fetchMock.mockImplementation(async (input: string) => {
    const url = new URL(input);
    if (url.pathname.endsWith('/stats')) return Response.json({ totalUsers, ...AUDIENCE });
    if (url.pathname.endsWith('/growth-by-source')) return Response.json(sources ?? []);
    if (url.pathname.endsWith('/growth')) return Response.json(points);
    throw new Error('Неожиданный маршрут');
  });
}
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('MCP_AGENT_TOKEN', 'test-agent-token');
});
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('аналитика пользователей MCP', () => {
  /** Проверяет согласованность сводки с накоплением до итогового числа пользователей. */
  it('учитывает аудиторию до периода и передаёт фильтр токена с авторизацией', async () => {
    mockAnalytics([{ date: '2026-10-11', count: 0 }, { date: '2026-10-12', count: 2 }], 7);
    const options = { period: '30d' as const, tokenId: 18, apiBaseUrl: 'http://test' };
    expect(await getUsersSummaryInDb(289, options)).toMatchObject({
      total_users: 7, new_users: 2, initial_users: 5,
      private_users: 4, group_users: 2, channel_users: 1, users_in_several_places: 1,
      blocked_bot_users: 3, deleted_users: 2,
    });
    const chart = await getUsersChartInDb(289, { ...options, mode: 'cumulative' });
    expect(chart).toMatchObject({
      accumulation_scope: 'all_time', points: [{ date: '2026-10-11', count: 5 }, { date: '2026-10-12', count: 7 }],
    });
    expect(chart).not.toHaveProperty('private_users');
    for (const [input, init] of fetchMock.mock.calls) {
      const url = new URL(input);
      expect(url.origin).toBe('http://test');
      expect(url.searchParams.get('tokenId')).toBe('18');
      expect(new Headers(init.headers).get('Authorization')).toBe('Bearer test-agent-token');
    }
  });
  /** Проверяет отсутствие выдуманных точек при пустом периоде. */
  it('возвращает пустой график и сохраняет существующую аудиторию', async () => {
    mockAnalytics([], 7);
    expect(await getUsersChartInDb(289, { mode: 'cumulative' })).toMatchObject({
      total_users: 7, new_users: 0, initial_users: 7, token_id: null, points: [], from: null, to: null,
    });
  });
  /** Проверяет сохранение значений источников при пропусках и границы накопления. */
  it('накапливает источники в пределах выбранного периода', async () => {
    const dates = ['2026-10-10', '2026-10-11', '2026-10-12'];
    mockAnalytics(dates.map((date, index) => ({ date, count: index === 1 ? 0 : 1 })), 7, [
      { date: dates[0], sources: { direct: 1 } }, { date: dates[1], sources: {} },
      { date: dates[2], sources: { referral: 1 } },
    ]);
    const result = await getUsersChartInDb(289, { mode: 'cumulative', groupBy: 'source' });
    expect(result).toMatchObject({ accumulation_scope: 'selected_period', group_by: 'source' });
    expect(result).toHaveProperty('points.1.sources.direct', 1);
    expect(result).toHaveProperty('points.2.sources.direct', 1);
    expect(result).toHaveProperty('points.2.sources.referral', 1);
  });
  /** Проверяет обычный режим без накопления. */
  it('в обычном режиме возвращает новых пользователей за каждый интервал', async () => {
    const points = [{ date: '2026-10-11', count: 2 }, { date: '2026-10-12', count: 0 }];
    mockAnalytics(points, 7);
    expect(await getUsersChartInDb(289, { mode: 'period' })).toMatchObject({ accumulation_scope: null, points });
  });
  /** Проверяет ограничение размера накопленного результата для разреженных источников. */
  it('отклоняет разрастание накопленного ряда свыше десяти тысяч значений', async () => {
    const sources = Array.from({ length: 150 }, (_, index) => ({
      date: new Date(Date.UTC(2026, 0, 1) + index * 86400000).toISOString(),
      sources: { [`source_${index}`]: 1 },
    }));
    mockAnalytics(sources.map(point => ({ date: point.date, count: 1 })), 150, sources);
    const result = await getUsersChartInDb(289, { mode: 'cumulative', groupBy: 'source' });
    expect(result).toHaveProperty('error');
    expect(result).not.toHaveProperty('points');
  });
  /** Проверяет отказ, если панель не прислала числа по местам. */
  it('отклоняет сводку без чисел по местам', async () => {
    fetchMock.mockImplementation(async (input: string) => {
      const url = new URL(input);
      if (url.pathname.endsWith('/stats')) return Response.json({ totalUsers: 7 });
      if (url.pathname.endsWith('/growth')) return Response.json([]);
      throw new Error('Неожиданный маршрут');
    });
    const result = await getUsersSummaryInDb(289);
    expect(result).toHaveProperty('error');
    expect(result).not.toHaveProperty('private_users');
  });
  /** Проверяет отклонение повреждённых счётчиков и дат вместо выдуманных результатов. */
  it.each([
    [{ date: '2026-10-12', count: -1 }], [{ date: '2026-10-12', count: '2' }],
    [{ date: 'invalid-date', count: 2 }],
  ])('отклоняет некорректную точку %j', async (point) => {
    mockAnalytics([point], 7);
    expect(await getUsersSummaryInDb(289)).toHaveProperty('error');
  });
  /** Проверяет, что отказ доступа не раскрывает тело ответа и данные проекта. */
  it.each([401, 403, 404])('возвращает безопасную ошибку HTTP %s', async (status) => {
    fetchMock.mockResolvedValue(new Response('secret-project-data', { status }));
    const result = await getUsersSummaryInDb(289);
    expect(result).toHaveProperty('error', expect.stringContaining(String(status)));
    expect(JSON.stringify(result)).not.toContain('secret-project-data');
  });
  /** Проверяет безопасную обработку недоступного сервера. */
  it('не раскрывает текст сетевой ошибки', async () => {
    fetchMock.mockRejectedValue(new Error('secret-network-data'));
    const result = await getUsersChartInDb(289);
    expect(result).toHaveProperty('error');
    expect(JSON.stringify(result)).not.toContain('secret-network-data');
  });
  /** Проверяет ранний отказ при неверных идентификаторах. */
  it('не вызывает HTTP для неверного проекта или токена', async () => {
    expect(await getUsersSummaryInDb(0)).toHaveProperty('error');
    expect(await getUsersChartInDb(289, { tokenId: -1 })).toHaveProperty('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
