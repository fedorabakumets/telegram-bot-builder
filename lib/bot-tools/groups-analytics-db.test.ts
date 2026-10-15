/** @fileoverview Проверки сводки и графика групп для агента. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGroupsChartInDb, getGroupsSummaryInDb } from './groups-analytics-db.ts';

const fetchMock = vi.fn();

/**
 * Подготавливает ответы сводки и ряда групп.
 * @param points - Точки первого сохранения
 * @param stats - Счётчики справочника
 * @returns Настраивает подменённый HTTP-клиент
 */
function mockGroups(points: unknown[] = [], stats: Record<string, number> = { totalGroups: 0, availableGroups: 0, kickedGroups: 0 }) {
  fetchMock.mockImplementation(async (input: string) => {
    const url = new URL(input);
    if (url.pathname.endsWith('/stats')) return Response.json({ ...stats, addedLast7Days: 99 });
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

describe('аналитика групп MCP', () => {
  /** Проверяет три счётчика и скрытие лишнего поля недели. */
  it('отдаёт сводку одного бота без числа за фиксированную неделю', async () => {
    mockGroups([], { totalGroups: 11, availableGroups: 9, kickedGroups: 2 });
    const result = await getGroupsSummaryInDb(12, { tokenId: 9, apiBaseUrl: 'http://test' });
    expect(result).toMatchObject({ project_id: 12, token_id: 9, total_groups: 11, available_groups: 9, kicked_groups: 2 });
    expect(result).not.toHaveProperty('added_last_7_days');
    const [input, init] = fetchMock.mock.calls[0];
    const url = new URL(input);
    expect(url.pathname).toBe('/api/projects/12/groups/analytics/stats');
    expect(url.searchParams.get('tokenId')).toBe('9');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer test-agent-token');
  });

  /** Проверяет ключ окна панели и накопление до текущего числа. */
  it('накапливает ряд до общего числа и передаёт окно 30 дней', async () => {
    mockGroups([{ date: '2026-10-10', count: 9 }, { date: '2026-10-12', count: 1 }], { totalGroups: 11, availableGroups: 9, kickedGroups: 2 });
    const result = await getGroupsChartInDb(12, { tokenId: 9, period: '30d', mode: 'cumulative', apiBaseUrl: 'http://test' });
    expect(result).toMatchObject({
      granularity: '1d', step: '1 day', mode: 'cumulative', accumulation_scope: 'all_time',
      points: [{ date: '2026-10-10', count: 10 }, { date: '2026-10-12', count: 11 }],
    });
    const growth = fetchMock.mock.calls.map(call => new URL(call[0])).find(url => url.pathname.endsWith('/growth'));
    expect(growth?.searchParams.get('granularity')).toBe('1d');
    expect(growth?.searchParams.get('tokenId')).toBe('9');
  });

  /** Проверяет обычный режим без накопления. */
  it('в обычном режиме возвращает новые группы по слотам', async () => {
    const points = [{ date: '2026-10-10', count: 9 }, { date: '2026-10-12', count: 1 }];
    mockGroups(points, { totalGroups: 11, availableGroups: 9, kickedGroups: 2 });
    expect(await getGroupsChartInDb(12, { tokenId: 9, mode: 'period' })).toMatchObject({ accumulation_scope: null, points });
  });

  /** Проверяет отказ до запроса, если бот не выбран. */
  it('не вызывает панель без бота', async () => {
    expect(await getGroupsSummaryInDb(12)).toHaveProperty('error');
    expect(await getGroupsChartInDb(12, { tokenId: 0 })).toHaveProperty('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /** Проверяет, что отказ доступа не раскрывает тело ответа. */
  it('не раскрывает тело ошибки панели', async () => {
    fetchMock.mockResolvedValue(new Response('secret-project-data', { status: 403 }));
    const result = await getGroupsSummaryInDb(12, { tokenId: 9 });
    expect(result).toHaveProperty('error', expect.stringContaining('403'));
    expect(JSON.stringify(result)).not.toContain('secret-project-data');
  });

  /** Проверяет отклонение повреждённых счётчиков. */
  it('отклоняет нечисловой счётчик сводки', async () => {
    fetchMock.mockResolvedValue(Response.json({ totalGroups: '11', availableGroups: 9, kickedGroups: 2 }));
    expect(await getGroupsSummaryInDb(12, { tokenId: 9 })).toHaveProperty('error');
  });
});
