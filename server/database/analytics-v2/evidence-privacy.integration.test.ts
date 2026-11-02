/** @fileoverview Полное удаление, повторная доставка, область доступа и откат исторических свидетельств. */
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from '../../routes/analytics/v2/test-database';
import { backfillAudienceEvidenceBatch } from './evidence-backfill';
import { recordLegacyEvidence } from './evidence-write';
import { seedLegacyEvidence } from './evidence-test-helpers';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup()); afterAll(() => database.cleanup());
describe('Границы исторического восстановления', () => {
  it('полное удаление очищает свидетельства, а replay старой истории не воскрешает человека', async () => {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      const policy = await seedLegacyEvidence(client); await backfillAudienceEvidenceBatch(client, policy);
      await client.query("DELETE FROM bot_users WHERE user_id=100");
      expect((await client.query('SELECT * FROM analytics_audience_evidence_v2')).rowCount).toBe(0);
      expect((await client.query('SELECT * FROM analytics_audience_v2')).rowCount).toBe(0);
      await client.query('INSERT INTO bot_users(project_id,token_id,user_id) VALUES(1,11,100)');
      expect((await backfillAudienceEvidenceBatch(client, { ...policy, writerSha256: 'b'.repeat(64) })).evidence_count).toBe('0');
      expect((await client.query('SELECT * FROM analytics_audience_v2')).rowCount).toBe(0);
      await client.query("UPDATE analytics_person_deletions_v2 SET deleted_through='2026-10-11'");
      const later = await seedLegacyEvidence(client, '100', 11, '2026-10-12T10:00:00Z');
      expect((await backfillAudienceEvidenceBatch(client, later)).audience_added).toBe('1');
      expect((await client.query('SELECT * FROM analytics_audience_evidence_v2')).rowCount).toBe(1);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
  it('откатывает курсор, человека, свидетельства и уведомления одной транзакцией', async () => {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      const policy = await seedLegacyEvidence(client, '101'); await backfillAudienceEvidenceBatch(client, policy);
      expect((await client.query('SELECT * FROM analytics_outbox_v2')).rowCount).toBe(1);
      await client.query('ROLLBACK');
      for (const table of ['analytics_audience_v2', 'analytics_audience_evidence_v2', 'analytics_evidence_backfill_v2', 'analytics_outbox_v2']) {
        expect((await client.query(`SELECT * FROM ${table}`)).rowCount).toBe(0);
      }
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
  it('проверяет проект, политику и дату; runtime не получает доступ к свидетельствам', async () => {
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      const policy = await seedLegacyEvidence(client, '102');
      await expect(backfillAudienceEvidenceBatch(client, { ...policy, tokenId: 21 })).rejects.toThrow('не принадлежит');
      await backfillAudienceEvidenceBatch(client, policy);
      const job = (await client.query('SELECT id FROM analytics_evidence_backfill_v2')).rows[0];
      const row = (await client.query('SELECT * FROM bot_messages WHERE id=$1', [policy.throughMessageId])).rows[0];
      await expect(recordLegacyEvidence(client, { ...policy, tokenId: 12 }, job.id, row)).rejects.toThrow('не принадлежит');
      const future = await seedLegacyEvidence(client, '103', 11, '2099-01-01T00:00:00Z');
      expect((await backfillAudienceEvidenceBatch(client, future)).audience_added).toBe('0');
      await client.query('ROLLBACK');
      await client.query(`SET ROLE ${database.runtimeRole}`);
      await expect(client.query('SELECT * FROM analytics_audience_evidence_v2')).rejects.toMatchObject({ code: '42501' });
      await expect(client.query('SELECT * FROM analytics_evidence_backfill_v2')).rejects.toMatchObject({ code: '42501' });
    } finally { await client.query('RESET ROLE'); await client.query('ROLLBACK'); client.release(); }
  });
  it('повторная миграция безопасна и удаление проекта очищает весь новый контур', async () => {
    const sql = readFileSync('migrations/0030_analytics_audience_evidence.sql', 'utf8').split('public.').join(`${database.schema}.`)
      .split('search_path = public, pg_temp').join(`search_path = ${database.schema}, pg_temp`);
    await database.pool.query(sql);
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      const policy = await seedLegacyEvidence(client, '104'); await backfillAudienceEvidenceBatch(client, policy);
      await client.query('DELETE FROM bot_projects WHERE id=1');
      expect((await client.query('SELECT * FROM analytics_audience_evidence_v2')).rowCount).toBe(0);
      expect((await client.query('SELECT * FROM analytics_evidence_backfill_v2')).rowCount).toBe(0);
    } finally { await client.query('ROLLBACK'); client.release(); }
  });
});
