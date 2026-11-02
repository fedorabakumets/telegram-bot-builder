/** @fileoverview Сравнение источников за равные периоды с фильтрами проекта и бота. */
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
import { readAnalyticsV2Snapshot } from './snapshot';

const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup());
afterAll(() => database.cleanup());

it('сравнивает источники по границам окна, не запрашивая предыдущие источники без сравнения', async () => {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("INSERT INTO analytics_sources(id,project_id,name) VALUES(7,1,'Текущий'),(8,1,'Прежний'),(9,1,'Другой бот')");
    for (const [token_id, source_id, user_id, occurred_at] of [
      [11, 8, '101', '2026-10-10T00:00:00Z'], [11, 8, '102', '2026-10-19T23:59:59Z'],
      [11, 7, '103', '2026-10-20T00:00:00Z'], [11, 7, '104', '2026-10-29T23:59:59Z'],
      [11, 7, '105', '2026-10-30T00:00:00Z'], [12, 9, '106', '2026-10-25T12:00:00Z'],
    ] as const) {
      const event = { project_id: 1, token_id, event_key: `msg:${user_id}:1`, kind: 'message_in', user_id, chat_id: user_id,
        chat_type: 'private', directed: true, occurred_at, source_id, metadata: { entry: true } };
      await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify(event)]);
    }
    const query = { from: '2026-10-20T00:00:00Z', to: '2026-10-30T00:00:00Z', timezone: 'Europe/Berlin', comparison: 'previous' };
    const value = await readAnalyticsV2Snapshot(client, 1, 11, query);
    expect(value.sources.find(item => item.id === '7')).toMatchObject({ new_users: 0, restored_users: 2 });
    expect(value.previous_sources?.find(item => item.id === '8')).toMatchObject({ new_users: 0, restored_users: 2 });
    expect(value.sources.some(item => item.id === '8' || item.id === '9')).toBe(false);
    expect(value.previous_sources?.some(item => item.id === '7')).toBe(false);
    expect((await readAnalyticsV2Snapshot(client, 1, null, query)).sources.some(item => item.id === '9')).toBe(true);
    expect((await readAnalyticsV2Snapshot(client, 2, null, query)).previous_sources).toEqual([]);
    expect((await readAnalyticsV2Snapshot(client, 1, 11, { ...query, comparison: '' })).previous_sources).toBeNull();
    expect((await readAnalyticsV2Snapshot(client, 1, 11, { period: 'all', comparison: 'previous' })).previous_sources).toBeNull();
  } finally { await client.query('ROLLBACK'); client.release(); }
});
