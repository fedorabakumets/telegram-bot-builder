/** @fileoverview Проверка прерываемого переноса старой истории без повторного подсчёта и ложных новых людей. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from '../../routes/analytics/v2/test-database';
import { backfillAnalyticsBatch } from './backfill';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup());
afterAll(() => database.cleanup());
describe('Возобновляемый перенос истории', () => {
  it('сохраняет контрольную точку и импортирует историю ровно один раз', async () => {
    await database.pool.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,telegram_message_id,created_at)
      VALUES(1,11,'100','user','private','100',1,'2026-10-01'),(1,11,'101','user','group','-100',2,'2026-10-02'),
      (1,11,'100','bot','private','100',3,'2026-10-03')`);
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      const first = await backfillAnalyticsBatch(client, 1, 11, 2);
      expect(first.complete).toBe(false); expect(first.imported).toBe('2');
      await client.query('COMMIT');
      await client.query('BEGIN');
      const second = await backfillAnalyticsBatch(client, 1, 11, 2);
      expect(second.complete).toBe(true); expect(second.imported).toBe('3');
      await client.query('COMMIT');
      await client.query('BEGIN');
      expect((await backfillAnalyticsBatch(client, 1, 11, 2)).imported).toBe('3');
      await client.query('COMMIT');
      const { rows } = await client.query('SELECT * FROM analytics_audience_v2');
      expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ user_id: '100', first_known: false });
      expect((await client.query('SELECT * FROM analytics_runtime_v2')).rowCount).toBe(0);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
  it('не принимает старую надпись о нажатии за доказательство настоящего callback', async () => {
    await database.pool.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,message_data,created_at)
      VALUES(1,11,'102','user','private','102','{"button_clicked":true,"button_text":"Меню"}','2026-10-04'),
      (1,11,'103','user','private','103','{"button_clicked":true,"callback_query_id":"123456789"}','2026-10-04')`);
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      const progress = await backfillAnalyticsBatch(client, 1, 11);
      await client.query('COMMIT');
      expect(progress.skipped).toBe('1');
      expect((await client.query("SELECT * FROM analytics_audience_v2 WHERE user_id='102'")).rowCount).toBe(0);
      expect((await client.query("SELECT event_key FROM analytics_events_v2 WHERE user_id='103'")).rows[0].event_key).toBe('cb:123456789');
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
});
