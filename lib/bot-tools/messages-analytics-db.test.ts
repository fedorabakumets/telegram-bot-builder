/** @fileoverview Проверки HTTP-фильтров, метрик, накопления и безопасных ошибок MCP сообщений. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMessagesChartInDb, getMessagesSummaryInDb } from './messages-analytics-db.ts';

const fetchMock = vi.fn();
/**
 * Подготавливает ответы действующих маршрутов статистики и активности.
 * @param points - Интервалы активности по направлениям.
 * @param totalInteractions - Текущий счётчик сохранённых сообщений.
 * @param totalUsers - Число текущих записей пользователей.
 * @returns Настраивает подменённый HTTP-клиент.
 */
function mockAnalytics(points: unknown[] = [], totalInteractions = 701, totalUsers = 7) {
  fetchMock.mockImplementation(async (input: string) => {
    const url = new URL(input);
    if (url.pathname.endsWith('/users/stats')) return Response.json({ totalUsers, totalInteractions });
    if (url.pathname.endsWith('/messages/activity')) return Response.json(points);
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

describe('аналитика сообщений MCP', () => {
  /** Проверяет смысл сводки и передачу фильтра бота и авторизации обоим маршрутам. */
  it('разделяет сохранённые сообщения и период и сохраняет дробное среднее', async () => {
    mockAnalytics([{ date: '2026-10-12T00:00:00.000Z', incoming: 15, outgoing: 78 }]);
    expect(await getMessagesSummaryInDb(289, { tokenId: 18, apiBaseUrl: 'http://test', period: '3h' })).toMatchObject({
      total_messages: 701, period_messages: 93, incoming_messages: 15, outgoing_messages: 78,
      average_per_user: 701 / 7, average_scope: 'retained_messages', average_denominator: 'current_bot_users',
      activity_source: 'bot_messages', timestamp_timezone: 'UTC', bucket_timezone: 'UTC',
    });
    for (const [input, init] of fetchMock.mock.calls) {
      const url = new URL(input);
      expect(url.origin).toBe('http://test');
      expect(url.searchParams.get('tokenId')).toBe('18');
      expect(new Headers(init.headers).get('Authorization')).toBe('Bearer test-agent-token');
      if (url.pathname.endsWith('/activity')) {
        expect(url.searchParams.get('granularity')).toBe('5m');
        expect(url.searchParams.get('split')).toBe('true');
      }
    }
  });
  /** Проверяет, что дневные агрегаты не ограничиваются сохранёнными сообщениями. */
  it('допускает активность периода выше счётчика сохранённой истории', async () => {
    mockAnalytics([{ date: '2026-10-12T00:00:00.000Z', incoming: 10, outgoing: 20 }], 5);
    expect(await getMessagesSummaryInDb(289)).toMatchObject({
      total_messages: 5, period_messages: 30, activity_source: 'message_activity_daily',
    });
  });
  /** Проверяет пустой период и отсутствие деления на ноль. */
  it('возвращает пустые точки и нулевое среднее для пустой аудитории', async () => {
    mockAnalytics([], 0, 0);
    expect(await getMessagesChartInDb(289, { mode: 'cumulative' })).toMatchObject({
      period_messages: 0, incoming_messages: 0, outgoing_messages: 0, average_per_user: 0,
      token_id: null, from: null, to: null, points: [], accumulation_scope: 'selected_period',
    });
  });
  /** Проверяет общий график и независимое накопление направлений через нулевые интервалы. */
  it('накапливает выбранный период от нуля для обоих видов графика', async () => {
    mockAnalytics([
      { date: '2026-10-10T00:00:00.000Z', incoming: 2, outgoing: 1 },
      { date: '2026-10-11T00:00:00.000Z', incoming: 0, outgoing: 0 },
      { date: '2026-10-12T00:00:00.000Z', incoming: 0, outgoing: 3 },
    ]);
    expect(await getMessagesChartInDb(289, { mode: 'cumulative' })).toMatchObject({ points: [
      { date: '2026-10-10T00:00:00.000Z', count: 3 }, { date: '2026-10-11T00:00:00.000Z', count: 3 }, { date: '2026-10-12T00:00:00.000Z', count: 6 },
    ] });
    expect(await getMessagesChartInDb(289, { mode: 'cumulative', split: 'direction' })).toMatchObject({ points: [
      { date: '2026-10-10T00:00:00.000Z', incoming: 2, outgoing: 1 },
      { date: '2026-10-11T00:00:00.000Z', incoming: 2, outgoing: 1 },
      { date: '2026-10-12T00:00:00.000Z', incoming: 2, outgoing: 4 },
    ] });
    expect(await getMessagesChartInDb(289)).toMatchObject({ accumulation_scope: null, points: [
      { date: '2026-10-10T00:00:00.000Z', count: 3 }, { date: '2026-10-11T00:00:00.000Z', count: 0 }, { date: '2026-10-12T00:00:00.000Z', count: 3 },
    ] });
  });
  /** Проверяет ограничение размера ответа и отклонение повреждённых данных. */
  it.each([
    [{ date: 'invalid', incoming: 1, outgoing: 1 }],
    [{ date: '2026-10-12T00:00:00.000Z', incoming: -1, outgoing: 1 }],
    [{ date: '2026-10-12T00:00:00.000Z', incoming: '1', outgoing: 1 }],
    Array.from({ length: 501 }, () => ({ date: '2026-10-12T00:00:00.000Z', incoming: 0, outgoing: 0 })),
  ].map(points => [points]))('отклоняет повреждённые или избыточные точки', async (points) => {
    mockAnalytics(points);
    expect(await getMessagesChartInDb(289)).toHaveProperty('error');
  });
  /** Проверяет отсутствие утечки тела ошибки проекта. */
  it.each([401, 403, 404])('скрывает тело HTTP %s', async (status) => {
    fetchMock.mockResolvedValue(new Response('secret-project-data', { status }));
    const result = await getMessagesSummaryInDb(289);
    expect(result).toHaveProperty('error', expect.stringContaining(String(status)));
    expect(JSON.stringify(result)).not.toContain('secret-project-data');
  });
  /** Проверяет отсутствие утечки сетевых подробностей. */
  it('скрывает текст сетевой ошибки', async () => {
    fetchMock.mockRejectedValue(new Error('secret-network-data'));
    const result = await getMessagesChartInDb(289);
    expect(result).toHaveProperty('error');
    expect(JSON.stringify(result)).not.toContain('secret-network-data');
  });
  /** Проверяет отклонение неверных параметров до сетевых запросов. */
  it('отклоняет неверный проект и токен без HTTP', async () => {
    expect(await getMessagesSummaryInDb(0)).toHaveProperty('error');
    expect(await getMessagesChartInDb(289, { tokenId: -1 })).toHaveProperty('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
