/** @fileoverview Наблюдения start сохраняются независимо, без auth-кодов и без изменения точной аудитории или CPA. */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from '../../routes/analytics/v2/test-database';
import { backfillStartObservationsBatch } from './start-observations-backfill';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup()); afterAll(() => database.cleanup());
describe('Перенос наблюдаемых start', () => {
  it('дедуплицирует разные обёртки по физическому ключу и не переписывает первоначальную атрибуцию', async () => {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,telegram_message_id,created_at,message_text) VALUES
        (1,11,'100','user','private','100',10,'2026-10-01T10:00:00.100Z','/start public_first'),
        (1,11,'100','user','private','100',10,'2026-10-01T10:00:00.500Z','/start public_first'),
        (1,11,'100','user','private','100',11,'2026-10-02','/start later_ad'),
        (1,11,'101','user','private','101',12,'2026-10-02','/start link_secret'),
        (1,11,'102','user','private','102',13,'2026-10-02','/start ref_42'),
        (1,11,'103','user','private','103',14,'2026-10-02','/start'),
        (1,11,'104','user','group','-100',15,'2026-10-02','/start unknown_handler'),
        (1,11,'105','user','group','-100',16,'2026-10-02','/start@FIRST_BOT addressed')`);
      await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify({ project_id: 1, token_id: 11, user_id: '100',
        kind: 'message_in', event_key: 'msg:100:10', chat_type: 'private', chat_id: '100', directed: true, occurred_at: '2026-10-01T10:00:00Z', provenance: 'backfill' })]);
      const initial = (await client.query('SELECT * FROM analytics_audience_v2')).rows;
      const first = await backfillStartObservationsBatch(client, 1, 11, 3); expect(first.complete).toBe(false);
      let progress = first; while (!progress.complete) progress = await backfillStartObservationsBatch(client, 1, 11, 3);
      expect(progress.imported).toBe('6'); expect(progress.skipped).toBe('1');
      expect((await backfillStartObservationsBatch(client, 1, 11)).batch.imported).toBe(0);
      expect((await client.query('SELECT * FROM analytics_audience_v2')).rows).toEqual(initial);
      const { rows } = await client.query('SELECT marker,category FROM analytics_start_observations_v2 ORDER BY id');
      expect(rows).toContainEqual({ marker: null, category: 'auth_candidate' }); expect(JSON.stringify(rows)).not.toContain('secret');
      expect((await client.query(`SELECT o.marker FROM analytics_audience_v2 a JOIN analytics_events_v2 e ON e.id=a.first_event_id
        JOIN analytics_start_observations_v2 o ON o.project_id=e.project_id AND o.token_id=e.token_id AND o.event_key=e.event_key`)).rows[0].marker).toBe('public_first');
      expect((await client.query("SELECT * FROM analytics_outbox_v2 WHERE affected @> ARRAY['sources']")).rowCount).toBeGreaterThan(0);
      await client.query('DELETE FROM bot_messages');
      expect((await client.query('SELECT * FROM analytics_start_observations_v2')).rowCount).toBe(6);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
  it('проверяет scope, полностью удаляет наблюдения человека и не воскрешает их повторным переносом', async () => {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`INSERT INTO bot_users(project_id,token_id,user_id) VALUES(1,11,200);
        INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,telegram_message_id,created_at,message_text)
        VALUES(1,11,'200','user','private','200',1,'2026-10-01','/start old_source')`);
      await expect(backfillStartObservationsBatch(client, 1, 21)).rejects.toThrow('не принадлежит');
      await backfillStartObservationsBatch(client, 1, 11);
      await client.query('DELETE FROM bot_users WHERE user_id=200');
      expect((await client.query('SELECT * FROM analytics_start_observations_v2')).rowCount).toBe(0);
      await client.query('UPDATE analytics_start_observation_backfill_v2 SET last_message_id=0');
      expect((await backfillStartObservationsBatch(client, 1, 11)).batch.imported).toBe(0);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
  it('откат сохраняет атомарность checkpoint и уведомлений; runtime не читает наблюдения', async () => {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,telegram_message_id,created_at,message_text)
        VALUES(1,11,'300','user','private','300',1,'2026-10-01','/start public')`);
      await backfillStartObservationsBatch(client, 1, 11); await client.query('ROLLBACK');
      expect((await client.query('SELECT * FROM analytics_start_observations_v2')).rowCount).toBe(0);
      expect((await client.query('SELECT * FROM analytics_start_observation_backfill_v2')).rowCount).toBe(0);
      await client.query(`SET ROLE ${database.runtimeRole}`);
      await expect(client.query('SELECT * FROM analytics_start_observations_v2')).rejects.toMatchObject({ code: '42501' });
    } finally { await client.query('RESET ROLE'); await client.query('ROLLBACK'); client.release(); }
  });
});
