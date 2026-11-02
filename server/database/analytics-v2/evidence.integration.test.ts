/** @fileoverview Исторические свидетельства восстанавливают аудиторию, сохраняя физические счётчики и неопределённость CPA. */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from '../../routes/analytics/v2/test-database';
import { readAnalyticsV2Snapshot } from '../../routes/analytics/v2/snapshot';
import { acquisitionReport } from '../../routes/analytics/acquisition/report';
import { backfillAnalyticsBatch } from './backfill';
import { backfillAudienceEvidenceBatch } from './evidence-backfill';
import { previewAudienceEvidence } from './evidence-preview';
import { seedLegacyEvidence } from './evidence-test-helpers';
const database = createAnalyticsTestDatabase();
const range = { from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z', step: '1d' };
beforeAll(() => database.setup()); afterAll(() => database.cleanup());
describe('Отдельное восстановление аудитории', () => {
  it('работает после старого checkpoint, возобновляется и не создаёт физических кликов', async () => {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      await seedLegacyEvidence(client, '100');
      const policy = await seedLegacyEvidence(client, '101');
      expect((await backfillAnalyticsBatch(client, 1, 11)).complete).toBe(true);
      expect((await previewAudienceEvidence(client, policy)).additional_people).toBe(2);
      expect((await backfillAudienceEvidenceBatch(client, policy, 1)).complete).toBe(false);
      expect((await backfillAudienceEvidenceBatch(client, policy, 1)).audience_added).toBe('2');
      expect((await backfillAudienceEvidenceBatch(client, policy, 1)).complete).toBe(true);
      expect((await backfillAudienceEvidenceBatch(client, policy, 1)).evidence_count).toBe('2');
      expect((await backfillAudienceEvidenceBatch(client, { ...policy, writerSha256: 'b'.repeat(64) })).evidence_count).toBe('0');
      const value = await readAnalyticsV2Snapshot(client, 1, 11, range);
      expect(value.current.audience).toMatchObject({ total_users: 2, restored_users: 2, active_users: 2, new_users: 0 });
      expect(value.current.messages).toEqual({ total: 0, incoming: 0, outgoing: 0, callbacks: 0, system: 0 });
      expect(value.points.reduce((sum, point) => sum + point.restored_users, 0)).toBe(2);
      expect(value.coverage.status).toBe('partial'); expect(value.leaders.users).toEqual([]);
      await client.query('DELETE FROM bot_messages');
      expect((await readAnalyticsV2Snapshot(client, 1, 11, { period: 'all' })).current.audience.total_users).toBe(2);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
  it('добавляет адресную команду и уникального человека проекта, а не дублирует сообщение', async () => {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      const p1 = await seedLegacyEvidence(client, '102');
      await client.query(`UPDATE bot_messages SET message_text='/start@first_bot',message_data='{}',telegram_message_id=7 WHERE id=$1`, [p1.throughMessageId]);
      await backfillAnalyticsBatch(client, 1, 11); await backfillAudienceEvidenceBatch(client, p1);
      const p2 = await seedLegacyEvidence(client, '102', 12); await backfillAudienceEvidenceBatch(client, p2);
      const value = await readAnalyticsV2Snapshot(client, 1, null, range);
      expect(value.current.audience).toMatchObject({ total_users: 1, restored_users: 1, active_users: 1 });
      expect(value.current.messages).toMatchObject({ incoming: 1, callbacks: 0 });
      expect(value.points.reduce((sum, point) => sum + point.restored_users, 0)).toBe(1);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
  it('раннее свидетельство отменяет позднюю точную первую атрибуцию, сохраняя возврат по рекламе', async () => {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SELECT mark_analytics_runtime_v2(1,11); UPDATE analytics_runtime_v2 SET coverage_from='2026-09-01';
        INSERT INTO analytics_sources(id,project_id,name) VALUES(7,1,'Источник');
        INSERT INTO analytics_placements(id,project_id,token_id,source_id,name,created_at) VALUES(8,1,11,7,'Размещение','2026-09-01');
        INSERT INTO analytics_expenses(project_id,placement_id,amount,currency,day) VALUES(1,8,3000,'RUB','2026-10-20')`);
      await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify({ project_id: 1, token_id: 11, user_id: '103', event_key: 'msg:103:1',
        kind: 'message_in', directed: true, chat_type: 'private', chat_id: '103', occurred_at: '2026-10-20T10:00:00Z', source_id: 7, placement_id: 8, metadata: { entry: true } })]);
      expect((await client.query("SELECT first_known FROM analytics_audience_v2 WHERE user_id='103'")).rows[0].first_known).toBe(true);
      const policy = await seedLegacyEvidence(client, '103'); await backfillAudienceEvidenceBatch(client, policy);
      expect((await client.query("SELECT first_known,first_event_id,source_id,placement_id,attribution_status FROM analytics_audience_v2 WHERE user_id='103'")).rows[0])
        .toEqual({ first_known: false, first_event_id: null, source_id: null, placement_id: null, attribution_status: 'unknown' });
      const value = await readAnalyticsV2Snapshot(client, 1, 11, range);
      expect(value.current.audience).toMatchObject({ new_users: 0, restored_users: 1, total_users: 1 });
      const later = await readAnalyticsV2Snapshot(client, 1, 11, { ...range, from: '2026-10-20T00:00:00Z' });
      expect(later.current.audience).toMatchObject({ returning_users: 1, restored_users: 0 });
      /** Возврат относится к окну после раннего обращения, а не ко всему времени жизни пользователя. */
      const lifetime = await acquisitionReport(client, 1, { tokenId: 11 });
      expect(lifetime.rows[0]).toMatchObject({ newUsers: 0, returningUsers: 0, costPerUser: null });
      const report = await acquisitionReport(client, 1, { tokenId: 11, from: '2026-10-20T00:00:00Z', to: range.to });
      expect(report.rows[0]).toMatchObject({ newUsers: 0, returningUsers: 1, costPerUser: null });
      expect((await client.query("SELECT source_id FROM analytics_events_v2 WHERE user_id='103'")).rows[0].source_id).toBe(7);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
  it('настоящие callback обеих форм получают только канонический идентификатор', async () => {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      const policy = await seedLegacyEvidence(client, '104');
      await client.query(`UPDATE bot_messages SET message_data='{"button_clicked":true,"callback_id":"777"}',chat_id=NULL WHERE id=$1`, [policy.throughMessageId]);
      await backfillAnalyticsBatch(client, 1, 11);
      await backfillAudienceEvidenceBatch(client, policy);
      expect((await client.query('SELECT event_key,chat_id FROM analytics_events_v2')).rows).toEqual([{ event_key: 'cb:777', chat_id: null }]);
      expect((await client.query('SELECT * FROM analytics_audience_evidence_v2')).rowCount).toBe(0);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
});
