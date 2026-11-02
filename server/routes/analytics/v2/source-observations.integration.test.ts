/** @fileoverview Исторические источники по физическому сообщению: поздние метки, секреты и проектная дедупликация. */
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
import { readAnalyticsV2Snapshot } from './snapshot';
const database = createAnalyticsTestDatabase();
beforeAll(async () => {
  await database.setup();
  await database.record({ user_id: '100', event_key: 'msg:100:1', provenance: 'backfill', occurred_at: '2026-10-20T10:00:00Z' });
  await database.record({ user_id: '101', event_key: 'msg:101:1', provenance: 'backfill', occurred_at: '2026-10-20T11:00:00Z' });
  await database.record({ user_id: '102', event_key: 'msg:102:1', provenance: 'backfill', occurred_at: '2026-10-20T12:00:00Z' });
  await database.record({ user_id: '100', token_id: 12, event_key: 'msg:100:2', provenance: 'backfill', occurred_at: '2026-10-21T10:00:00Z' });
  await database.pool.query(`INSERT INTO analytics_start_observations_v2(project_id,token_id,user_id,legacy_message_id,event_key,observed_at,marker,category) VALUES
    (1,11,'100',1,'msg:100:1','2026-10-20T10:00:00.100Z','channel_a','marker'),
    (1,11,'100',2,'msg:100:3','2026-10-21T10:00:00Z','late_ad','marker'),
    (1,11,'101',3,'msg:101:1','2026-10-20T11:00:00Z',NULL,'auth_candidate'),
    (1,11,'102',4,'msg:102:1','2026-10-20T12:00:00Z','ref_55','referral_unknown'),
    (1,12,'100',5,'msg:100:2','2026-10-21T10:00:00Z','second_bot','marker')`);
});
afterAll(() => database.cleanup());
/** Читает проверяемую область с фиксированными границами. */
async function snapshot(token: number | null = null) {
  const client = await database.pool.connect();
  try { return await readAnalyticsV2Snapshot(client, 1, token, { from: '2026-10-20T00:00:00Z', to: '2026-10-23T00:00:00Z' }, Date.parse('2026-11-01')); }
  finally { client.release(); }
}
it('связывает первую метку по сообщению, не по времени записи и не по позднему входу', async () => {
  const value = await snapshot();
  expect(value.sources.find(s => s.id === 'observed:channel_a')).toMatchObject({ restored_users: 1, new_users: 0, returning_users: 0 });
  expect(value.sources.find(s => s.id === 'observed:late_ad')).toMatchObject({ restored_users: 0, new_users: 0, returning_users: 0, starts: 1 });
  expect(value.sources.find(s => s.id === 'observed:second_bot')?.restored_users).toBe(0);
  expect(value.source_points.reduce((n, p) => n + p.new_users + (p.restored_users ?? 0), 0)).toBe(3);
  expect(value.current.audience.new_users).toBe(0);
});
it('не выдаёт auth и неподтверждённого реферера за рекламный источник', async () => {
  const value = await snapshot(11);
  expect(value.sources.find(s => s.id === 'auth_candidate')?.restored_users).toBe(1);
  expect(value.sources.find(s => s.id === 'referral_unknown')?.restored_users).toBe(1);
  expect(JSON.stringify(value.sources)).not.toContain('ref_55');
  expect((await snapshot(12)).sources.find(s => s.id === 'observed:second_bot')?.restored_users).toBe(1);
});
it('возврат по поздней метке учитывает только людей до начала периода и исключает повтор того же события', async () => {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    const event = { project_id: 1, token_id: 11, user_id: '100', event_key: 'msg:100:4', kind: 'message_in', directed: true,
      chat_type: 'private', chat_id: '100', occurred_at: '2026-10-22T10:00:00Z', observed_tag: 'late_ad', metadata: { entry: true } };
    await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify(event)]);
    await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify(event)]);
    await client.query(`INSERT INTO analytics_start_observations_v2(project_id,token_id,user_id,legacy_message_id,event_key,observed_at,marker,category)
      VALUES(1,11,'100',6,'msg:100:4','2026-10-22T10:00:00Z','late_ad','marker')`);
    const value = await readAnalyticsV2Snapshot(client, 1, 11, { from: '2026-10-21T00:00:00Z', to: '2026-10-23T00:00:00Z' });
    expect(value.sources.find(s => s.id === 'observed:late_ad')).toMatchObject({ new_users: 0, restored_users: 0, returning_users: 1, starts: 2 });
    expect(value.sources.find(s => s.id === 'observed:channel_a')).toBeUndefined();
  } finally { await client.query('ROLLBACK'); client.release(); }
});
