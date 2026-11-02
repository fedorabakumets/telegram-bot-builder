/** @fileoverview Независимый фоновый курсор start-меток охватывает всех владельцев и возобновляется после остановки. */
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from '../routes/analytics/v2/test-database';
import { testHistoryWorker, seedHistoryMessages } from './history-backfill-test-helpers';
import { startAnalyticsStartObservationsBackfill } from './start-observations-backfill';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup()); afterAll(() => database.cleanup());
beforeEach(async () => { await database.pool.query(`TRUNCATE bot_messages,analytics_start_observations_v2,analytics_start_observation_backfill_v2,
  analytics_outbox_v2,analytics_versions_v2 CASCADE`); });
describe('Фоновый контур наблюдаемых start', () => {
  it('переносит несколько проектов независимо от event checkpoint и повторно ничего не добавляет', async () => {
    await seedHistoryMessages(database.pool, 2); await seedHistoryMessages(database.pool, 1, 2, 21);
    await database.pool.query("UPDATE bot_messages SET message_text='/start public_source'");
    const worker = testHistoryWorker(database.pool, {}, startAnalyticsStartObservationsBackfill);
    try {
      expect(await worker.done).toMatchObject({ event: 'completed', scopes: 2, completed: 2 });
      expect((await database.pool.query('SELECT * FROM analytics_start_observations_v2')).rowCount).toBe(3);
      expect((await database.pool.query('SELECT * FROM analytics_events_v2')).rowCount).toBe(0);
    } finally { await worker.stop(); }
    const again = testHistoryWorker(database.pool, {}, startAnalyticsStartObservationsBackfill);
    try { expect(await again.done).toMatchObject({ event: 'completed', scopes: 0 }); }
    finally { await again.stop(); }
  });
  it('сохраняет отдельный checkpoint при stop и обрабатывает оставшиеся метки следующим запуском', async () => {
    await seedHistoryMessages(database.pool, 3); await database.pool.query("UPDATE bot_messages SET message_text='/start public_source'");
    let stopping: Promise<void> | undefined;
    const worker = testHistoryWorker(database.pool, { batchSize: 1, pauseMs: 5000, logger: event => {
      if (event.event === 'batch') stopping = worker.stop();
    } }, startAnalyticsStartObservationsBackfill);
    expect((await worker.done).event).toBe('cancelled'); await stopping;
    expect((await database.pool.query('SELECT * FROM analytics_start_observations_v2')).rowCount).toBe(1);
    const next = testHistoryWorker(database.pool, {}, startAnalyticsStartObservationsBackfill);
    try {
      expect((await next.done).event).toBe('completed');
      expect((await database.pool.query('SELECT * FROM analytics_start_observations_v2')).rowCount).toBe(3);
      await database.pool.query('DELETE FROM bot_projects WHERE id=1');
      expect((await database.pool.query('SELECT * FROM analytics_start_observations_v2')).rowCount).toBe(0);
      expect((await database.pool.query('SELECT * FROM analytics_start_observation_backfill_v2')).rowCount).toBe(0);
    } finally { await next.stop(); }
  });
});
