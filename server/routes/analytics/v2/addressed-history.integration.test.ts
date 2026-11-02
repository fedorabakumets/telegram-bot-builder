/** @fileoverview Проверка адресных команд после очистки истории и при нескольких ботах. */
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
import { readAnalyticsV2Snapshot } from './snapshot';
import { seedLegacyEvidence } from '../../../database/analytics-v2/evidence-test-helpers';
import { backfillAudienceEvidenceBatch } from '../../../database/analytics-v2/evidence-backfill';
import { backfillAnalyticsBatch } from '../../../database/analytics-v2/backfill';

const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup());
afterAll(() => database.cleanup());

it('учитывает проверенную команду один раз в окне и сохраняет связь после удаления переписки', async () => {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    const policy = await seedLegacyEvidence(client, '100', 11, '2026-10-20T12:00:00Z');
    await client.query("UPDATE bot_messages SET message_text='/start@first_bot',message_data='{}',telegram_message_id=7 WHERE id=$1", [policy.throughMessageId]);
    const other = await seedLegacyEvidence(client, '101', 11, '2026-10-20T13:00:00Z');
    await client.query("UPDATE bot_messages SET message_text='/start@other_bot',message_data='{}',telegram_message_id=8 WHERE id=$1", [other.throughMessageId]);
    await backfillAnalyticsBatch(client, 1, 11);
    await backfillAudienceEvidenceBatch(client, other);
    const event = { project_id: 1, token_id: 12, event_key: 'msg:-100:7', kind: 'message_in', user_id: '100', chat_id: '-100',
      chat_type: 'supergroup', directed: false, occurred_at: '2026-10-20T12:00:00Z' };
    await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify(event)]);
    const query = { from: '2026-10-20T12:00:00Z', to: '2026-10-20T13:00:00Z', comparison: 'previous', step: '5m' };
    const before = await readAnalyticsV2Snapshot(client, 1, null, query);
    expect(before.current.messages).toMatchObject({ incoming: 1, incoming_to_bot: 1, chat_scopes: { group: { incoming_to_bot: 1 } } });
    expect(before.points.reduce((sum, point) => sum + point.incoming_to_bot, 0)).toBe(1);
    expect(before.previous?.messages.incoming_to_bot).toBe(0);
    expect((await readAnalyticsV2Snapshot(client, 1, 12, query)).current.messages.incoming_to_bot).toBe(0);
    /** Имитируем свидетельства, записанные до появления устойчивой привязки. */
    await client.query('UPDATE analytics_audience_evidence_v2 SET message_event_key=NULL');
    await client.query('COMMIT');
    const migration = readFileSync('migrations/0036_analytics_evidence_message_identity.sql', 'utf8')
      .split('public.').join(`${database.schema}.`).split('search_path = public, pg_temp').join(`search_path = ${database.schema}, pg_temp`);
    await client.query(migration);
    await client.query(migration);
    await client.query('DELETE FROM bot_messages');
    const after = await readAnalyticsV2Snapshot(client, 1, null, query);
    expect(after.current.messages.incoming_to_bot).toBe(1);
    expect(after.points.reduce((sum, point) => sum + point.incoming_to_bot, 0)).toBe(1);
    expect((await readAnalyticsV2Snapshot(client, 1, 11, query)).current.messages.incoming_to_bot).toBe(1);
    expect((await client.query("SELECT count(*)::int n FROM analytics_events_v2 WHERE kind='message_in' AND event_key='msg:-100:7'")).rows[0].n).toBe(2);
    await client.query("UPDATE analytics_events_v2 SET directed=true WHERE project_id=1 AND token_id=11 AND event_key='msg:-100:7'");
    expect((await readAnalyticsV2Snapshot(client, 1, null, query)).current.messages.incoming_to_bot).toBe(1);
    await client.query("DELETE FROM analytics_events_v2 WHERE project_id=1 AND token_id=11 AND event_key='msg:-100:7'");
    expect((await readAnalyticsV2Snapshot(client, 1, null, query)).current.messages.incoming_to_bot).toBe(1);
    expect((await readAnalyticsV2Snapshot(client, 1, 11, query)).current.messages.incoming_to_bot).toBe(1);
    await client.query("DELETE FROM analytics_events_v2 WHERE project_id=1 AND token_id=12 AND event_key='msg:-100:7'");
    const evidenceOnly = await readAnalyticsV2Snapshot(client, 1, null, query);
    expect(evidenceOnly.current.messages.chat_scopes.group.incoming_to_bot).toBe(1);
    expect(evidenceOnly.points.reduce((sum, point) => sum + point.incoming_to_bot, 0)).toBe(1);
  } finally { await client.query('ROLLBACK'); client.release(); }
});
