/** @fileoverview Интеграционные проверки маршрута диапазонов, снимка и фильтров доступа. */
import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Pool } from 'pg';
import { setupAnalyticsRangeRoutes } from '../../server/routes/analytics/setup-range-routes.ts';
/**
 * Выполняет HTTP-запрос к маршруту с контролируемым соединением БД.
 * @param query - Параметры HTTP.
 * @param database - Ответы соединения.
 * @returns Ответ и журнал SQL.
 */
async function requestRange(query: string, database = vi.fn(async (sql: string, _values?: unknown[]) => {
  if (sql.startsWith('SELECT id FROM bot_tokens')) return { rowCount: 1, rows: [{ id: 5 }] };
  if (sql.startsWith('WITH events')) return { rows: [{ summary: { count: 1, incoming: 1, outgoing: 0, newcomers: 0 }, points: [
    { date: '2026-10-01T00:00:00', count: 1, incoming: 1, outgoing: 0, newcomers: 0 },
  ] }] };
  return { rows: [] };
})) {
  const release = vi.fn();
  const connect = vi.fn(async () => ({ query: database, release }));
  const app = express();
  setupAnalyticsRangeRoutes(app, { connect } as unknown as Pool, (_req, _res, next) => next());
  const server = app.listen(0);
  try {
    const address = server.address() as { port: number };
    const response = await fetch(`http://127.0.0.1:${address.port}/api/projects/289/analytics/range?${query}`);
    return { status: response.status, body: await response.json(), database, connect, release };
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
}
describe('Маршрут точной аналитики', () => {
  it('параметризует границы и сравнивает дневные окна в одном снимке', async () => {
    const result = await requestRange('metric=active_users&from=2026-10-01T00:00:00Z&to=2026-10-03T00:00:00Z&step=1d&comparison=previous');
    expect(result.status).toBe(200);
    expect(result.body.change.count).toEqual({ current: 1, previous: 1, absolute_change: 0, percent_change: 0 });
    const queries = result.database.mock.calls;
    expect(queries[0][0]).toContain('REPEATABLE READ READ ONLY');
    const counts = queries.filter(([sql]) => sql.startsWith('WITH events'));
    expect(counts).toHaveLength(2);
    expect(counts[0][0]).toContain('user_activity_daily');
    expect(counts[0][0]).toContain('COUNT(DISTINCT uid)');
    expect(counts[0][1]).toEqual([289, null, '2026-10-01T00:00:00.000Z', '2026-10-03T00:00:00.000Z', 86400000]);
    expect(counts[1][1]).toEqual([289, null, '2026-09-29T00:00:00.000Z', '2026-10-01T00:00:00.000Z', 86400000]);
    expect(result.release).toHaveBeenCalledOnce();
    expect(queries.at(-1)?.[0]).toBe('COMMIT');
  });
  it('использует сохранённые сообщения для обоих окон при внутридневной базе', async () => {
    const result = await requestRange('metric=messages&from=2026-10-01T00:00:00Z&to=2026-10-03T00:00:00Z&step=1d&comparison=explicit&compare_from=2026-09-01T01:00:00Z&compare_to=2026-09-03T01:00:00Z');
    expect(result.status).toBe(200);
    expect(result.body.current.source).toBe('bot_messages');
    expect(result.body.previous.source).toBe('bot_messages');
    expect(result.body.current.retention_description).toContain('очистка');
  });
  it('отклоняет чужой токен и не читает метрики', async () => {
    const database = vi.fn(async (_sql: string, _values?: unknown[]) => ({ rowCount: 0, rows: [] }));
    const result = await requestRange('metric=messages&tokenId=5', database);
    expect(result.status).toBe(403);
    expect(database.mock.calls.some(([sql]) => sql.startsWith('WITH events'))).toBe(false);
    expect(result.release).toHaveBeenCalledOnce();
  });
  it.each(['metric=unknown', 'metric=messages&from=', 'metric=messages&comparison=explicit', 'metric=messages&step=__proto__', 'metric=messages&tokenId=1&tokenId=2'])('не открывает БД при некорректном запросе %s', async query => {
    const result = await requestRange(query);
    expect(result.status).toBe(400);
    expect(result.connect).not.toHaveBeenCalled();
  });
});
