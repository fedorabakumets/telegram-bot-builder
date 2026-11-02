/** @fileoverview Проверки автоматических свидетельств: все области, повторный запуск и продолжение курсора. */
import {beforeAll,afterAll,expect,it} from 'vitest';
import {createAnalyticsTestDatabase} from '../routes/analytics/v2/test-database';
import {seedLegacyEvidence} from '../database/analytics-v2/evidence-test-helpers';
import {captureAutomaticEvidenceScopes,transferAutomaticEvidence} from './automatic-evidence-backfill';
const database=createAnalyticsTestDatabase();
beforeAll(()=>database.setup());afterAll(()=>database.cleanup());
it('переносит разные проекты и ботов, не создаёт сообщения и продолжает только новые строки',async()=>{
  const client=await database.pool.connect();
  try {
    await seedLegacyEvidence(client,'100',11);await seedLegacyEvidence(client,'101',12);
    await client.query("INSERT INTO bot_users(project_id,token_id,user_id) VALUES(2,21,200)");
    await client.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,message_data,created_at)
      VALUES(2,21,'200','user','supergroup','-200','{"button_clicked":true,"button_text":"Меню","callback_data":"legacy"}','2026-10-10')`);
    await client.query(`INSERT INTO bot_messages(project_id,token_id,user_id,message_type,chat_type,chat_id,message_text,telegram_message_id,created_at)
      VALUES(1,11,'100','user','supergroup','-100','/menu@first_bot',15,'2026-10-11'),
      (1,11,'100','user','supergroup','-100','/menu@another_bot',16,'2026-10-11')`);
    const scopes=await captureAutomaticEvidenceScopes(client);expect(scopes).toHaveLength(3);
    await client.query('BEGIN');await transferAutomaticEvidence(client,scopes,new AbortController().signal,1);
    expect((await database.pool.query('SELECT count(*)::int n FROM analytics_audience_evidence_v2')).rows[0].n).toBe(0);
    await client.query('COMMIT');
    expect((await client.query('SELECT count(*)::int n FROM analytics_audience_evidence_v2')).rows[0].n).toBe(4);
    expect((await client.query('SELECT count(*)::int n FROM analytics_audience_v2')).rows[0].n).toBe(3);
    expect((await client.query('SELECT count(*)::int n FROM analytics_events_v2')).rows[0].n).toBe(0);
    expect(await captureAutomaticEvidenceScopes(client)).toHaveLength(0);
    await seedLegacyEvidence(client,'102',11);
    await client.query('BEGIN');await transferAutomaticEvidence(client,await captureAutomaticEvidenceScopes(client),new AbortController().signal,1);await client.query('COMMIT');
    expect((await client.query('SELECT count(*)::int n FROM analytics_audience_evidence_v2')).rows[0].n).toBe(5);
    expect((await client.query('SELECT sum(scanned)::int n FROM analytics_evidence_backfill_v2')).rows[0].n).toBe(6);
    expect(await captureAutomaticEvidenceScopes(client)).toHaveLength(0);
  } finally {await client.query('ROLLBACK');client.release();}
});
