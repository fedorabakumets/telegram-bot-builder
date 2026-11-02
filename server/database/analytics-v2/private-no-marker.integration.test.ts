/** @fileoverview Идемпотентная миграция личных обращений без метки сохраняет авторизацию, историю и события. */
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from '../../routes/analytics/v2/test-database';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup());
afterAll(() => database.cleanup());
it('обновляет только подходящие первые личные сообщения и уведомляет один раз', async () => {
  await database.record({ user_id: '100', event_key: 'msg:100:1', provenance: 'backfill', attribution_status: 'unknown' });
  await database.record({ user_id: '101', event_key: 'msg:101:1', provenance: 'backfill', attribution_status: 'unknown' });
  await database.record({ user_id: '102', event_key: 'cb:102', kind: 'callback', chat_type: 'group', chat_id: '-100', attribution_status: 'unknown' });
  await database.pool.query(`INSERT INTO analytics_start_observations_v2(project_id,token_id,user_id,legacy_message_id,event_key,observed_at,category)
    VALUES(1,11,'101',1,'msg:101:1','2026-10-20', 'auth_candidate')`);
  const before = (await database.pool.query('SELECT count(*)::int count FROM analytics_events_v2')).rows[0].count;
  const migration = readFileSync('migrations/0032_analytics_private_no_marker.sql','utf8');
  await database.pool.query(migration);
  const first = (await database.pool.query("SELECT user_id,attribution_status,first_known FROM analytics_audience_v2 ORDER BY user_id")).rows;
  expect(first).toEqual([
    { user_id: '100', attribution_status: 'no_marker', first_known: false },
    { user_id: '101', attribution_status: 'unknown', first_known: false },
    { user_id: '102', attribution_status: 'unknown', first_known: false },
  ]);
  const revision = (await database.pool.query('SELECT revision FROM analytics_versions_v2 WHERE project_id=1')).rows[0].revision;
  await database.pool.query(migration);
  expect((await database.pool.query('SELECT revision FROM analytics_versions_v2 WHERE project_id=1')).rows[0].revision).toBe(revision);
  expect((await database.pool.query('SELECT count(*)::int count FROM analytics_events_v2')).rows[0].count).toBe(before);
});
