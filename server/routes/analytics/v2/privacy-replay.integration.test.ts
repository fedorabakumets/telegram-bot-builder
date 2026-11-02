/** @fileoverview Повтор доставки после удаления не восстанавливает человека и его старые показатели. */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup());
afterAll(() => database.cleanup());
describe('Удаление и повторная доставка', () => {
  it('отбрасывает очередь и backfill до границы удаления, но разрешает новое действие', async () => {
    await database.pool.query('INSERT INTO bot_users(project_id,token_id,user_id) VALUES(1,11,880)');
    const event = { event_key: 'msg:880:1', user_id: '880', chat_id: '880' };
    await database.record(event);
    await database.pool.query('DELETE FROM bot_users WHERE user_id=880');
    const before = (await database.pool.query('SELECT COUNT(*) count FROM analytics_outbox_v2')).rows[0].count;
    expect(await database.record(event)).toMatchObject({ event_id: null, inserted: false, discarded: true, reason: 'person_deleted' });
    expect(await database.record({ ...event, event_key: 'backfill:old', provenance: 'backfill' })).toMatchObject({ discarded: true });
    expect((await database.pool.query('SELECT COUNT(*) count FROM analytics_outbox_v2')).rows[0].count).toBe(before);
    expect((await database.pool.query("SELECT * FROM analytics_events_v2 WHERE user_id='880'")).rowCount).toBe(0);
    const { rows: [marker] } = await database.pool.query('SELECT * FROM analytics_person_deletions_v2');
    expect(marker.person_key).toMatch(/^[a-f0-9]{64}$/); expect(marker).not.toHaveProperty('user_id');
    const after = new Date(marker.deleted_through.getTime() + 1000).toISOString();
    expect(await database.record({ ...event, event_key: 'msg:880:2', occurred_at: after })).toMatchObject({ inserted: true });
  });
  it('подтверждает удалённую область, но не скрывает ошибку доступа к чужому боту', async () => {
    expect(await database.record({ token_id: 999 })).toMatchObject({ inserted: false, discarded: true, reason: 'resource_deleted' });
    await expect(database.record({ token_id: 21 })).rejects.toMatchObject({ code: '42501' });
    const client = await database.pool.connect();
    try {
      await client.query(`SET ROLE ${database.runtimeRole}`);
      await client.query("SELECT set_config('app.project_id','1',false),set_config('app.token_id','999',false)");
      const payload = JSON.stringify({ project_id: 1, token_id: 999 });
      expect((await client.query('SELECT record_analytics_event_v2($1::jsonb) result', [payload])).rows[0].result.reason).toBe('resource_deleted');
      await expect(client.query("SELECT record_analytics_event_v2('{\"project_id\":1,\"token_id\":11}'::jsonb)")).rejects.toMatchObject({ code: '42501' });
    } finally { await client.query('RESET ROLE'); client.release(); }
  });
});
