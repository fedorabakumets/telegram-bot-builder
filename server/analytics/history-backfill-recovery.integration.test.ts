/** @fileoverview Координация реплик, независимые повторные попытки и отмена ожидающего исполнителя. */
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from '../routes/analytics/v2/test-database';
import { testHistoryWorker, seedHistoryMessages } from './history-backfill-test-helpers';
import { ANALYTICS_HISTORY_BACKFILL_LOCK } from './history-backfill';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup()); afterAll(() => database.cleanup());
beforeEach(async () => { await database.pool.query(`TRUNCATE bot_messages,analytics_backfill_v2,analytics_events_v2,analytics_audience_v2,
  analytics_daily_v2,analytics_outbox_v2,analytics_versions_v2 CASCADE`); });
describe('Восстановление и реплики', () => {
  it('изолирует некорректную SQL-строку savepoint и сохраняет явный пропуск вместе с курсором', async () => {
    await seedHistoryMessages(database.pool, 2);
    await database.pool.query(`CREATE FUNCTION reject_test_row() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.user_id='900000001' THEN RAISE EXCEPTION 'secret_bad_row' USING ERRCODE='22023'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_test_row BEFORE INSERT ON analytics_events_v2 FOR EACH ROW EXECUTE FUNCTION reject_test_row()`);
    const worker = testHistoryWorker(database.pool);
    try {
      expect(await worker.done).toMatchObject({ completed: 1, failed: 0 });
      expect(worker.logs.find(log => log.event === 'batch')).toMatchObject({ scanned: 2, imported: 1, skipped: 1, reasons: { invalid_row_22023: 1 } });
      expect((await database.pool.query('SELECT scanned,skipped FROM analytics_backfill_v2')).rows[0]).toEqual({ scanned: '2', skipped: '1' });
      expect(JSON.stringify(worker.logs)).not.toContain('secret');
    } finally { await worker.stop(); await database.pool.query('DROP TRIGGER reject_test_row ON analytics_events_v2; DROP FUNCTION reject_test_row()'); }
  });
  it('две реплики не пишут одновременно и ожидающая подхватывает остановленную', async () => {
    await seedHistoryMessages(database.pool, 6);
    let batchReady: () => void = () => undefined;
    const batch = new Promise<void>(resolve => { batchReady = resolve; });
    const first = testHistoryWorker(database.pool, { batchSize: 1, pauseMs: 10000, logger: event => { if (event.event === 'batch') batchReady(); } });
    await batch;
    let waitingReady: () => void = () => undefined;
    const waiting = new Promise<void>(resolve => { waitingReady = resolve; });
    const second = testHistoryWorker(database.pool, { logger: event => { if (event.event === 'waiting') waitingReady(); } });
    try {
      await waiting;
      expect((await database.pool.query('SELECT * FROM analytics_events_v2')).rowCount).toBe(1);
      await first.stop(); expect((await second.done).event).toBe('completed');
      expect((await database.pool.query('SELECT * FROM analytics_events_v2')).rowCount).toBe(6);
      expect((await database.pool.query('SELECT scanned FROM analytics_backfill_v2')).rows[0].scanned).toBe('6');
    } finally { await first.stop(); await second.stop(); }
  });
  it('отмена не ждёт занятого advisory lock и не удерживает своё соединение', async () => {
    const holder = await database.pool.connect();
    await holder.query('SELECT pg_advisory_lock($1)', [ANALYTICS_HISTORY_BACKFILL_LOCK]);
    let ready: () => void = () => undefined; const waiting = new Promise<void>(resolve => { ready = resolve; });
    const worker = testHistoryWorker(database.pool, { lockRetryMs: 60000, logger: event => { if (event.event === 'waiting') ready(); } });
    try { await waiting; const start = Date.now(); await worker.stop(); expect(Date.now() - start).toBeLessThan(1000); }
    finally { await worker.stop(); await holder.query('SELECT pg_advisory_unlock($1)', [ANALYTICS_HISTORY_BACKFILL_LOCK]); holder.release(); }
  });
  it('ошибка одного бота получает ограниченные повторы, не мешая второму проекту', async () => {
    await seedHistoryMessages(database.pool, 1); await seedHistoryMessages(database.pool, 1, 2, 21);
    await database.pool.query(`CREATE FUNCTION reject_test_history() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.token_id=11 THEN RAISE EXCEPTION 'secret_body_link_private' USING ERRCODE='P0001'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_test_history BEFORE INSERT ON analytics_events_v2 FOR EACH ROW EXECUTE FUNCTION reject_test_history()`);
    const worker = testHistoryWorker(database.pool, { maxRetries: 2 });
    try {
      expect(await worker.done).toMatchObject({ completed: 1, failed: 1 });
      expect(worker.logs.filter(log => log.event === 'retry')).toHaveLength(2);
      expect(worker.logs.find(log => log.event === 'scope_failed')).toMatchObject({ code: 'P0001' });
      expect(JSON.stringify(worker.logs)).not.toContain('secret');
      expect((await database.pool.query('SELECT token_id FROM analytics_events_v2')).rows).toEqual([{ token_id: 21 }]);
    } finally { await worker.stop(); await database.pool.query('DROP TRIGGER reject_test_history ON analytics_events_v2; DROP FUNCTION reject_test_history()'); }
  });
});
