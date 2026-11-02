/** @fileoverview Фоновое восстановление всех владельцев: конечный запуск, сохранённый курсор и безопасные пропуски. */
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from '../routes/analytics/v2/test-database';
import { testHistoryWorker, seedHistoryMessages } from './history-backfill-test-helpers';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup()); afterAll(() => database.cleanup());
beforeEach(async () => { await database.pool.query(`TRUNCATE bot_messages,analytics_backfill_v2,analytics_events_v2,analytics_audience_v2,
  analytics_daily_v2,analytics_outbox_v2,analytics_versions_v2,analytics_runtime_v2 CASCADE`); });
describe('Автоматический перенос истории', () => {
  it('обрабатывает два проекта и несколько ботов, пропускает плохие строки и не создаёт runtime/evidence', async () => {
    await seedHistoryMessages(database.pool, 2); await seedHistoryMessages(database.pool, 1, 1, 12); await seedHistoryMessages(database.pool, 1, 2, 21);
    await database.pool.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,message_data,created_at,message_text)
      VALUES(1,11,'987654321','user','private','987654321','{"button_clicked":true,"callback_data":"link_secret"}','2026-10-01','secret_text'),
      (1,11,'987654322','user','private','987654322','{}','2099-01-01','secret_future'),
      (1,21,'987654323','user','private','987654323','{}','2026-10-01','wrong_scope')`);
    const worker = testHistoryWorker(database.pool, { batchSize: 2 });
    try {
      expect(await worker.done).toMatchObject({ event: 'completed', scopes: 3, completed: 3, failed: 0 });
      expect((await database.pool.query('SELECT * FROM analytics_events_v2')).rowCount).toBe(4);
      expect((await database.pool.query('SELECT * FROM analytics_audience_v2 WHERE first_known')).rowCount).toBe(0);
      expect((await database.pool.query('SELECT * FROM analytics_runtime_v2')).rowCount).toBe(0);
      expect((await database.pool.query('SELECT * FROM analytics_audience_evidence_v2')).rowCount).toBe(0);
      const reasons = worker.logs.flatMap(log => Object.keys(log.reasons || {}));
      expect(reasons).toContain('callback_identity_missing'); expect(reasons).toContain('invalid_timestamp');
      expect(JSON.stringify(worker.logs)).not.toMatch(/987654321|secret|wrong_scope/);
    } finally { await worker.stop(); }
    const repeat = testHistoryWorker(database.pool);
    try { expect(await repeat.done).toMatchObject({ event: 'completed', scopes: 0 }); }
    finally { await repeat.stop(); }
  });
  it('останавливается между пачками и после нового запуска продолжает checkpoint без дублей', async () => {
    await seedHistoryMessages(database.pool, 7);
    let stopping: Promise<void> | undefined;
    const worker = testHistoryWorker(database.pool, { batchSize: 2, pauseMs: 5000, logger: event => { if (event.event === 'batch') stopping = worker.stop(); } });
    expect((await worker.done).event).toBe('cancelled'); await stopping;
    expect((await database.pool.query('SELECT * FROM analytics_events_v2')).rowCount).toBe(2);
    const second = testHistoryWorker(database.pool, { batchSize: 2 });
    try {
      expect((await second.done).event).toBe('completed');
      expect((await database.pool.query('SELECT * FROM analytics_events_v2')).rowCount).toBe(7);
      expect((await database.pool.query('SELECT scanned,imported FROM analytics_backfill_v2')).rows[0]).toEqual({ scanned: '7', imported: '7' });
    } finally { await second.stop(); }
  });
  it('не продлевает захваченную верхнюю границу новыми сообщениями работающей платформы', async () => {
    await seedHistoryMessages(database.pool, 1); let added: Promise<unknown> | undefined;
    const worker = testHistoryWorker(database.pool, { logger: event => {
      if (event.event === 'started') added = database.pool.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,telegram_message_id,created_at)
        VALUES(1,11,'999999999','user','private','999999999',2,'2026-10-02')`);
    } });
    try {
      await worker.done; await added;
      expect((await database.pool.query('SELECT * FROM analytics_events_v2')).rowCount).toBe(1);
    } finally { await worker.stop(); }
    const next = testHistoryWorker(database.pool);
    try { await next.done; expect((await database.pool.query('SELECT * FROM analytics_events_v2')).rowCount).toBe(2); }
    finally { await next.stop(); }
  });
});
