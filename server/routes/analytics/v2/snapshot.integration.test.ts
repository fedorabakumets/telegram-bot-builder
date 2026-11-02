/** @fileoverview Реальные SQL-проверки согласованного снимка, уникальности и источников. */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { createAnalyticsTestDatabase } from './test-database';
import { readAnalyticsV2Snapshot } from './snapshot';
import { setupAnalyticsV2Routes } from './setup-routes';
const database = createAnalyticsTestDatabase();
const now = Date.parse('2026-11-01T00:00:00Z');
let server: Server;
let base: string;
beforeAll(async () => {
  await database.setup();
  await database.pool.query(`INSERT INTO bot_users(project_id,token_id,user_id,first_name) VALUES(1,11,90,'Старый');
    SELECT mark_analytics_runtime_v2(1,11); SELECT mark_analytics_runtime_v2(1,12);
    UPDATE analytics_runtime_v2 SET coverage_from='2026-10-01T00:00:00Z';
    INSERT INTO analytics_sources(id,project_id,name) VALUES(7,1,'Размещение в канале');
    INSERT INTO bot_users(project_id,token_id,user_id,first_name,is_premium,language_code) VALUES(1,11,43,'Новый',1,'ru');
    INSERT INTO bot_groups(project_id,token_id,group_id,name) VALUES(1,11,'-100','Чат проекта');`);
  await database.record({ occurred_at: '2026-10-20T12:00:00Z' });
  await database.record({ event_key: 'msg:42:2', occurred_at: '2026-10-30T12:00:00Z' });
  await database.record({ event_key: 'msg:43:3', user_id: '43', chat_id: '43', occurred_at: '2026-10-30T13:00:00Z', source_id: 7, metadata: { entry: true } });
  await database.record({ token_id: 12, event_key: 'msg:43:4', user_id: '43', chat_id: '43', occurred_at: '2026-10-30T14:00:00Z' });
  for (const token_id of [11, 12]) await database.record({ token_id, event_key: 'msg:-100:10', user_id: '44', chat_id: '-100', chat_type: 'group', directed: false, occurred_at: '2026-10-30T15:00:00Z' });
  await database.record({ event_key: 'cb:45', user_id: '45', kind: 'callback', occurred_at: '2026-10-31T12:00:00Z', metadata: { button_label: 'Открыть каталог' } });
  await database.record({ event_key: 'msg:90:11', user_id: '90', occurred_at: '2026-10-30T16:00:00Z' });
  await database.record({ event_key: 'msg_out:43:12', user_id: '43', kind: 'message_out', occurred_at: '2026-10-31T13:00:00Z' });
  await database.record({ event_key: 'system:13', user_id: null, kind: 'system', occurred_at: '2026-10-31T14:00:00Z' });
  const app = express();
  setupAnalyticsV2Routes(app, database.pool, (req, res, next) => Number(req.params.id) === 1 ? next() : void res.status(403).json({ message: 'Нет доступа' }));
  await new Promise<void>(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(async () => {
  if (server) await new Promise<void>(resolve => server.close(() => resolve()));
  await database.cleanup();
});
/** Читает настоящий снимок в той же транзакционной изоляции, что использует HTTP. */
async function snapshot(token: number | null = null, query: Record<string, string> = { period: '7d', comparison: 'previous' }, at = now) {
  const client = await database.pool.connect();
  try {
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const value = await readAnalyticsV2Snapshot(client, 1, token, query, at);
    await client.query('COMMIT');
    return value;
  } finally { await client.query('ROLLBACK'); client.release(); }
}
describe('Общий снимок аналитики', () => {
  it('сохраняет даты закреплённых точек при живом обновлении скользящего окна', async () => {
    const first = await snapshot(null, { period: '30d', comparison: 'previous' }, now + 12345000);
    const second = await snapshot(null, { period: '30d', comparison: 'previous' }, now + 12375000);
    expect(first.range.from).not.toBe(second.range.from);
    expect(first.points.map(point => point.date)).toEqual(second.points.map(point => point.date));
    expect(first.source_points).toEqual(second.source_points);
    expect(first.current).toEqual(second.current);
    for (const point of first.source_points) expect(first.points.some(item => item.date === point.date)).toBe(true);
    expect(first.points.every(point => new Date(Date.parse(point.date) + 3 * 3600000).toISOString().endsWith('T00:00:00.000Z'))).toBe(true);
    expect(first.points.reduce((sum, point) => sum + point.incoming, 0)).toBe(first.current.messages.incoming);
  });
  it('обрезает счётчики крайних интервалов исходными границами, сохраняя их стабильные даты', async () => {
    const value = await snapshot(null, { from: '2026-10-30T12:30:00Z', to: '2026-10-31T12:30:00Z', step: '1d' });
    expect(value.points.map(point => point.date)).toEqual(['2026-10-29T21:00:00.000Z', '2026-10-30T21:00:00.000Z']);
    expect(value.current.messages).toMatchObject({ incoming: 4, outgoing: 0, callbacks: 1 });
    expect(value.points.reduce((sum, point) => sum + point.incoming, 0)).toBe(4);
    expect(value.points.reduce((sum, point) => sum + point.outgoing, 0)).toBe(0);
    expect(value.source_points.find(point => point.id === '7')?.date).toBe('2026-10-29T21:00:00.000Z');
  });
  it('разделяет людей, сообщения, callback и наблюдавшуюся переписку', async () => {
    const value = await snapshot();
    expect(value.current.audience).toEqual({ new_users: 2, restored_users: 1, first_history_status: 'partial', total_users: 4, active_users: 4, returning_users: 1, unknown_first_users: 1 });
    expect(value.current.messages).toMatchObject({ incoming: 5, outgoing: 1, callbacks: 1, historical_callbacks: 0, system: 1, total: 6 });
    expect(value.current.groups).toEqual({ active_groups: 1, participants: 1, directed_actions: 0 });
    expect(value.leaders.groups).toEqual([]);
    expect(value.leaders.groups_observed[0]).toMatchObject({ id: '-100', name: 'Чат проекта', messages: 1 });
    expect(value.leaders.users.some(user => user.id === '44')).toBe(false);
    expect(value.buttons).toEqual([{ label: 'Открыть каталог', count: 1, people: 1, historical_count: 0 }]);
  });
  it('сопоставляет источники, точки и сравнение без суммы дневных уникальных', async () => {
    const value = await snapshot();
    expect(value.previous?.audience.new_users).toBe(1);
    expect(value.points.reduce((sum, point) => sum + point.new_users, 0)).toBe(2);
    expect(value.points.reduce((sum, point) => sum + point.incoming, 0)).toBe(5);
    expect(value.sources.find(source => source.id === '7')).toMatchObject({ label: 'Размещение в канале', new_users: 1, starts: 1 });
    expect(value.source_points.find(source => source.id === '7')?.new_users).toBe(1);
    expect(value.coverage.status).toBe('complete');
    expect(value.next_recompute_at).toBeTruthy();
    expect(value.composition).toMatchObject({ premium: 1, regular: 1, unknown: 2 });
  });
  it('обрабатывает HTTP через настоящий fetch и проверяет проект, бота и параметры', async () => {
    expect((await fetch(`${base}/api/projects/1/analytics/v2/snapshot?period=all`)).status).toBe(200);
    expect((await fetch(`${base}/api/projects/1/analytics/v2/snapshot?tokenId=21`)).status).toBe(403);
    expect((await fetch(`${base}/api/projects/2/analytics/v2/snapshot`)).status).toBe(403);
    expect((await fetch(`${base}/api/projects/1/analytics/v2/snapshot?timezone=Bad/Zone`)).status).toBe(400);
  });
  it('показывает дату последней законченной проверки без ошибок и не выдаёт частичную за полную', async () => {
    await database.pool.query(`INSERT INTO chat_access_check_jobs VALUES
      (1,11,'completed',10,10,0,'2026-10-20T12:00:00Z'),
      (1,11,'completed',10,10,1,'2026-10-29T12:00:00Z'),
      (1,12,'cancelled',10,5,0,'2026-10-30T12:00:00Z')`);
    expect((await snapshot()).availability.checked_at).toBe('2026-10-20T12:00:00.000Z');
    expect((await snapshot(12)).availability.checked_at).toBeNull();
  });
});
