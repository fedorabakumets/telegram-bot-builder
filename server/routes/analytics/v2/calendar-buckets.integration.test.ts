/** @fileoverview Проверка календарных дней, DST и совпадения интервалов аудитории с источниками. */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
import { readAnalyticsV2Snapshot } from './snapshot';
import { resolveV2Range } from './range';
import { queryV2Points } from './query-points';
import { v2BucketCount } from './buckets';
const database = createAnalyticsTestDatabase();
const now = Date.parse('2026-11-02T12:00:00Z');
beforeAll(async () => {
  await database.setup();
  await database.pool.query(`SELECT mark_analytics_runtime_v2(1,11); UPDATE analytics_runtime_v2 SET coverage_from='2026-01-01';
    INSERT INTO analytics_sources(id,project_id,name) VALUES(1,1,'Календарный источник')`);
  const times = ['2026-10-01T20:59:59.999Z', '2026-10-01T21:00:00Z', '2026-03-29T00:30:00Z',
    '2026-03-29T01:30:00Z', '2026-10-25T00:30:00Z', '2026-10-25T01:30:00Z'];
  for (const [index, occurred_at] of times.entries()) await database.record({ user_id: String(100 + index),
    chat_id: String(100 + index), event_key: `msg:${100 + index}:1`, occurred_at, source_id: 1 });
});
afterAll(() => database.cleanup());
/**
 * Читает согласованный снимок для календарной проверки.
 * @param query - Пояс, границы и шаг.
 * @param at - Общий момент обновления.
 * @returns Настоящий SQL-снимок.
 */
async function snapshot(query: Record<string, string>, at = now) {
  const client = await database.pool.connect();
  try { return await readAnalyticsV2Snapshot(client, 1, 11, query, at); }
  finally { client.release(); }
}
describe('Календарные интервалы графиков', () => {
  it('разделяет события на московской полуночи, сохраняя точные границы запроса', async () => {
    const query = { from: '2026-09-30T21:00:00Z', to: '2026-10-02T21:00:00Z', step: '1d', timezone: 'Europe/Moscow' };
    const value = await snapshot(query);
    expect(value.range).toMatchObject({ from: new Date(query.from).toISOString(), to: new Date(query.to).toISOString() });
    expect(value.points.map(({ date, end_date, incoming }) => ({ date, end_date, incoming }))).toEqual([
      { date: '2026-09-30T21:00:00.000Z', end_date: '2026-10-01T21:00:00.000Z', incoming: 1 },
      { date: '2026-10-01T21:00:00.000Z', end_date: '2026-10-02T21:00:00.000Z', incoming: 1 },
    ]);
    expect(value.source_points.map(point => [point.date, point.end_date, point.new_users])).toEqual(value.points.map(point => [point.date, point.end_date, point.new_users]));
    const clipped = await snapshot({ ...query, from: '2026-10-01T21:00:00Z', to: '2026-10-01T21:30:00Z' });
    expect(clipped.current.messages.incoming).toBe(1); expect(clipped.points).toHaveLength(1);
    expect(clipped.points[0].end_date).toBe('2026-10-02T21:00:00.000Z');
  });
  it.each([
    ['весенний', '2026-03-28T23:00:00Z', '2026-03-29T22:00:00Z', 23],
    ['осенний', '2026-10-24T22:00:00Z', '2026-10-25T23:00:00Z', 25],
  ])('показывает %s день Berlin одним интервалом фактической длительности', async (_name, from, to, hours) => {
    const value = await snapshot({ from: String(from), to: String(to), step: '1d', timezone: 'Europe/Berlin' });
    expect(value.points).toHaveLength(1);
    expect(value.points[0]).toMatchObject({ date: new Date(from).toISOString(), end_date: new Date(to).toISOString(), incoming: 2, new_users: 2 });
    expect((Date.parse(value.points[0].end_date!) - Date.parse(value.points[0].date)) / 3600000).toBe(hours);
    expect(value.source_points[0]).toMatchObject({ date: value.points[0].date, end_date: value.points[0].end_date, new_users: 2 });
    expect(v2BucketCount(Date.parse(String(from)), Date.parse(String(to)), 86400000, 'Europe/Berlin')).toBe(1);
  });
  it('оставляет повторяющиеся осенние часы разными физическими интервалами UTC', async () => {
    const value = await snapshot({ from: '2026-10-25T00:00:00Z', to: '2026-10-25T02:00:00Z', step: '1h', timezone: 'Europe/Berlin' });
    expect(value.points.map(point => [point.date, point.end_date, point.incoming])).toEqual([
      ['2026-10-25T00:00:00.000Z', '2026-10-25T01:00:00.000Z', 1], ['2026-10-25T01:00:00.000Z', '2026-10-25T02:00:00.000Z', 1],
    ]);
  });
  it('сохраняет общие точки при обновлении до и после локальной полуночи', async () => {
    const first = await snapshot({ period: '30d', timezone: 'Europe/Moscow' }, Date.parse('2026-10-31T20:59:45Z'));
    const second = await snapshot({ period: '30d', timezone: 'Europe/Moscow' }, Date.parse('2026-10-31T21:00:15Z'));
    expect(second.points[second.points.length - 1]?.date).toBe('2026-10-31T21:00:00.000Z');
    for (const point of first.points.slice(1)) expect(second.points.find(item => item.date === point.date)?.end_date).toBe(point.end_date);
  });
  it('ограничивает весь срок 500 календарными точками вместе с неполными краями', async () => {
    const from = '2025-01-01T12:30:00Z';
    const to = Date.parse(from) + 500 * 86400000;
    expect(() => resolveV2Range({ period: 'all', step: '1d', timezone: 'Europe/Berlin' }, to, from)).toThrow();
    const range = resolveV2Range({ period: 'all', timezone: 'Europe/Berlin' }, to, from);
    const client = await database.pool.connect();
    try {
      const points = await queryV2Points(client, 1, 11, range);
      expect(points.length).toBeLessThanOrEqual(500);
      expect(points.length).toBe(v2BucketCount(Date.parse(range.from), Date.parse(range.to), range.step_ms, range.timezone));
    } finally { client.release(); }
  });
});
