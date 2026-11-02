/** @fileoverview Восстановленная история первых действий сохраняет неопределённость и не увеличивает точное привлечение. */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
import { readAnalyticsV2Snapshot } from './snapshot';
import { acquisitionReport } from '../acquisition/report';
const database = createAnalyticsTestDatabase();
const now = Date.parse('2026-11-01T00:00:00Z');
beforeAll(async () => {
  await database.setup();
  await database.pool.query(`SELECT mark_analytics_runtime_v2(1,11); SELECT mark_analytics_runtime_v2(1,12);
    UPDATE analytics_runtime_v2 SET coverage_from='2026-09-01T00:00:00Z';
    INSERT INTO analytics_sources(id,project_id,name) VALUES(7,1,'Историческое размещение');
    INSERT INTO analytics_placements(id,project_id,token_id,source_id,name,created_at)
      VALUES(8,1,11,7,'Публикация','2026-09-01T00:00:00Z');
    INSERT INTO analytics_expenses(project_id,placement_id,amount,currency,day) VALUES(1,8,3000,'RUB','2026-10-20');
    INSERT INTO analytics_legacy_people_v2(project_id,token_id,user_id) VALUES(1,11,'103')`);
  await database.record({ user_id: '100', event_key: 'msg:100:1', provenance: 'backfill', source_id: 7, placement_id: 8, occurred_at: '2026-10-20T10:00:00Z' });
  await database.record({ user_id: '100', event_key: 'msg:100:2', provenance: 'backfill', occurred_at: '2026-10-21T10:00:00Z' });
  await database.record({ token_id: 12, user_id: '100', event_key: 'msg:100:3', provenance: 'backfill', occurred_at: '2026-10-22T10:00:00Z' });
  await database.record({ user_id: '101', event_key: 'msg:101:1', source_id: 7, placement_id: 8, occurred_at: '2026-10-21T11:00:00Z' });
  await database.record({ user_id: '102', event_key: 'msg:-100:1', chat_id: '-100', chat_type: 'supergroup', directed: false, provenance: 'backfill', occurred_at: '2026-10-21T12:00:00Z' });
  await database.record({ user_id: '104', event_key: 'msg:104:1', provenance: 'backfill', occurred_at: '2026-10-10T10:00:00Z' });
  await database.record({ user_id: '104', event_key: 'msg:104:2', provenance: 'backfill', occurred_at: '2026-10-21T10:00:00Z' });
});
afterAll(() => database.cleanup());
/**
 * Читает снимок без изменения перенесённых фактов.
 * @param token - Бот либо весь проект.
 * @param from - Включённое начало окна.
 * @param to - Исключённый конец окна.
 * @returns Сводка и ряды реального SQL-снимка.
 */
async function snapshot(token: number | null = null, from = '2026-10-20T00:00:00Z', to = '2026-10-23T00:00:00Z') {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    return await readAnalyticsV2Snapshot(client, 1, token, { from, to, step: '1d', comparison: 'previous' }, now);
  } finally { await client.query('ROLLBACK'); client.release(); }
}
describe('Восстановленные первые взаимодействия', () => {
  it('показывает человека один раз в проекте и отдельно от точного привлечения', async () => {
    const value = await snapshot();
    expect(value.current.audience).toEqual({ new_users: 1, restored_users: 1, first_history_status: 'partial', total_users: 3,
      active_users: 3, returning_users: 1, unknown_first_users: 2 });
    expect(value.points.reduce((sum, point) => sum + point.restored_users, 0)).toBe(1);
    expect(value.points.find(point => point.date === '2026-10-19T21:00:00.000Z')?.restored_users).toBe(1);
    expect(value.points.find(point => point.date === '2026-10-21T21:00:00.000Z')?.restored_users).toBe(0);
    expect(value.sources.find(source => source.id === '7')?.new_users).toBe(1);
    expect(value.source_points.reduce((sum, point) => sum + point.new_users, 0)).toBe(1);
    /** Исторические контакты видны по источникам, не увеличивая точное привлечение. */
    expect(value.sources.reduce((sum, source) => sum + (source.restored_users ?? 0), 0)).toBe(1);
    expect(value.source_points.reduce((sum, point) => sum + (point.restored_users ?? 0), 0)).toBe(1);
    expect(value.coverage.legacy_unknown_users).toBe(3);
  });
  it('при выборе бота показывает его собственную первую сохранённую дату', async () => {
    const value = await snapshot(12);
    expect(value.current.audience).toMatchObject({ new_users: 0, restored_users: 1, total_users: 1, first_history_status: 'partial' });
    expect(value.points.find(point => point.date === '2026-10-21T21:00:00.000Z')?.restored_users).toBe(1);
  });
  it('различает точный пустой период и неполную предыдущую историю', async () => {
    const value = await snapshot(null, '2026-10-23T00:00:00Z', '2026-10-26T00:00:00Z');
    expect(value.current.audience).toMatchObject({ new_users: 0, restored_users: 0, first_history_status: 'complete' });
    expect(value.previous?.audience).toMatchObject({ new_users: 1, restored_users: 1, first_history_status: 'partial' });
  });
  it('не выдаёт отсутствие самой истории за точный нулевой приход', async () => {
    const client = await database.pool.connect();
    try {
      const value = await readAnalyticsV2Snapshot(client, 2, 21, { period: '30d' }, now);
      expect(value.current.audience).toMatchObject({ new_users: 0, restored_users: 0, first_history_status: 'unavailable' });
    } finally { client.release(); }
  });
  it('не делает восстановленных людей точными и не включает их в цену привлечения', async () => {
    const client = await database.pool.connect();
    try {
      const report = await acquisitionReport(client, 1, { tokenId: 11 });
      expect(report.rows[0]).toMatchObject({ newUsers: 1, costPerUser: null, complete: false });
      expect(report.rows[0].reason).toContain('неполная');
      expect(report.rows[0].costPerUserByCurrency).toEqual({ RUB: null, USD: null });
      expect((await client.query("SELECT first_known FROM analytics_audience_v2 WHERE project_id=1 AND user_id='100'")).rows.every(row => row.first_known === false)).toBe(true);
    } finally { client.release(); }
  });
});
