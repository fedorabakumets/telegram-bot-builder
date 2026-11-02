/** @fileoverview Аудированные старые нажатия получают источник чата без новых физических событий и ложного привлечения. */
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
import { seedLegacyEvidence } from '../../../database/analytics-v2/evidence-test-helpers';
import { backfillAudienceEvidenceBatch } from '../../../database/analytics-v2/evidence-backfill';
import { readAnalyticsV2Snapshot } from './snapshot';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup()); afterAll(() => database.cleanup());
it('различает личку, известную группу и недостающий чат; миграция идемпотентна', async () => {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN');
    await seedLegacyEvidence(client, '100');
    await client.query("UPDATE bot_messages SET chat_type='private',chat_id='100' WHERE user_id='100'");
    await seedLegacyEvidence(client, '101');
    await seedLegacyEvidence(client, '101');
    const policy = await seedLegacyEvidence(client, '102');
    await client.query("UPDATE bot_messages SET chat_id=NULL WHERE user_id='102'");
    await client.query("INSERT INTO bot_groups(project_id,token_id,group_id,name) VALUES(1,11,'-100','Наш чат'),(2,21,'-100','Чужой чат')");
    await backfillAudienceEvidenceBatch(client, policy);
    await client.query('COMMIT');
    const migration = readFileSync('migrations/0033_analytics_evidence_no_marker.sql','utf8');
    await client.query(migration);
    const revision = (await client.query('SELECT revision FROM analytics_versions_v2 WHERE project_id=1')).rows[0].revision;
    await client.query(migration);
    expect((await client.query('SELECT revision FROM analytics_versions_v2 WHERE project_id=1')).rows[0].revision).toBe(revision);
    const value = await readAnalyticsV2Snapshot(client, 1, 11, { period: 'all' }, Date.parse('2026-11-01'));
    expect(value.sources.find(s => s.id === 'no_marker')?.restored_users).toBe(1);
    expect(value.sources.find(s => s.id === 'group:11:-100')).toMatchObject({ label: 'Группа · Наш чат', restored_users: 1, new_users: 0 });
    expect(value.sources.find(s => s.id === 'unknown')?.restored_users).toBe(1);
    /** Повторные исторические записи не увеличивают уникальных людей и физические действия. */
    expect(value.leaders.groups.find(g => g.id === '-100')).toMatchObject({ people: 1, total: 0, callbacks: 0 });
    /** Повторы старой кнопки считаются по людям, не превращаясь в точные нажатия. */
    expect(value.buttons.find(b => b.label === 'Меню')).toMatchObject({ people: 3, count: 0, historical_count: 4 });
    await client.query('DELETE FROM bot_messages');
    const afterClear = await readAnalyticsV2Snapshot(client, 1, 11, { period: 'all' }, Date.parse('2026-11-01'));
    expect(afterClear.buttons.find(b => b.label === 'Меню')).toMatchObject({ people: 3, count: 0, historical_count: 4 });
    expect(value.current.messages.callbacks).toBe(0);
    expect(value.current.audience.total_users).toBe(3);
    expect((await client.query('SELECT count(*)::int count FROM analytics_events_v2')).rows[0].count).toBe(0);
  } finally { await client.query('ROLLBACK'); client.release(); }
});
