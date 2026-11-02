/** @fileoverview Вся история и источники появляются после единственного commit; ошибка откатывает оба контура и курсоры. */
import {beforeAll,afterAll,beforeEach,expect,it} from 'vitest';
import {createAnalyticsTestDatabase} from '../routes/analytics/v2/test-database';
import {transferAnalyticsHistoryAtomically} from './atomic-history-backfill';
import {seedLegacyEvidence} from '../database/analytics-v2/evidence-test-helpers';
import {seedHistoryMessages} from './history-backfill-test-helpers';
const database=createAnalyticsTestDatabase();
beforeAll(()=>database.setup());afterAll(()=>database.cleanup());
beforeEach(async()=>{await database.pool.query('TRUNCATE bot_messages,analytics_backfill_v2,analytics_start_observation_backfill_v2,analytics_start_observations_v2,analytics_events_v2,analytics_audience_v2,analytics_versions_v2,analytics_outbox_v2 CASCADE');});
it('публикует несколько проектов, источники и курсоры одновременно и не повторяет перенесённое',async()=>{
  await seedHistoryMessages(database.pool,3);await seedHistoryMessages(database.pool,2,2,21);
  await database.pool.query("UPDATE bot_messages SET message_text='/start test_atomic'");
  const client=await database.pool.connect();
  try{
    await client.query('BEGIN');
    await transferAnalyticsHistoryAtomically(client,new AbortController().signal,1);
    expect((await client.query('SELECT count(*)::int count FROM analytics_events_v2')).rows[0].count).toBe(5);
    expect((await database.pool.query('SELECT count(*)::int count FROM analytics_events_v2')).rows[0].count).toBe(0);
    expect((await database.pool.query('SELECT count(*)::int count FROM analytics_start_observations_v2')).rows[0].count).toBe(0);
    expect((await database.pool.query('SELECT count(*)::int count FROM analytics_backfill_v2')).rows[0].count).toBe(0);
    await client.query('COMMIT');
    expect((await database.pool.query('SELECT count(*)::int count FROM analytics_start_observations_v2')).rows[0].count).toBe(5);
    await client.query('BEGIN');expect(await transferAnalyticsHistoryAtomically(client,new AbortController().signal,1)).toBe(0);await client.query('COMMIT');
  }finally{await client.query('ROLLBACK');client.release();}
});
it('ошибка второго контура откатывает уже обработанные события и контрольные точки',async()=>{
  await seedHistoryMessages(database.pool,2);
  await database.pool.query("UPDATE bot_messages SET message_text='/start test_atomic'");
  const client=await database.pool.connect();
  try{
    await client.query('BEGIN');
    await seedLegacyEvidence(client,'999');
    await client.query(`CREATE FUNCTION fail_marker_test() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'test failure'; END$$;
      CREATE TRIGGER fail_marker_test BEFORE INSERT ON analytics_start_observations_v2 FOR EACH ROW EXECUTE FUNCTION fail_marker_test()`);
    await expect(transferAnalyticsHistoryAtomically(client,new AbortController().signal,1)).rejects.toThrow('test failure');
    await client.query('ROLLBACK');
    for(const table of ['analytics_events_v2','analytics_backfill_v2','analytics_start_observations_v2','analytics_start_observation_backfill_v2','analytics_audience_evidence_v2','analytics_evidence_backfill_v2'])expect((await database.pool.query(`SELECT count(*)::int count FROM ${table}`)).rows[0].count).toBe(0);
  }finally{await client.query('ROLLBACK');client.release();}
});
