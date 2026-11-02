/** @fileoverview Источник группы берётся только из первого настоящего callback в проверенной области бота. */
import { beforeAll, afterAll, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
import { readAnalyticsV2Snapshot } from './snapshot';
const database = createAnalyticsTestDatabase();
beforeAll(async () => {
  await database.setup();
  /** Новые события теста имеют подтверждённое покрытие работающей сборки. */
  await database.pool.query("SELECT mark_analytics_runtime_v2(1,11); SELECT mark_analytics_runtime_v2(1,12); UPDATE analytics_runtime_v2 SET coverage_from='2026-10-01'");
  await database.pool.query(`INSERT INTO bot_groups(project_id,token_id,group_id,name) VALUES
    (1,11,'-1001','Общение'),(1,12,'-1001','Другая группа'),(2,21,'-1001','Чужая группа')`);
  await database.record({ user_id: '100', event_key: 'cb:100', kind: 'callback', chat_type: 'supergroup', chat_id: '-1001' });
  await database.record({ user_id: '101', event_key: 'msg:101:1' });
  await database.record({ user_id: '101', event_key: 'cb:101', kind: 'callback', chat_type: 'supergroup', chat_id: '-1001', occurred_at: '2026-10-21T12:00:00Z' });
  await database.record({ user_id: '102', event_key: 'msg:-1001:3', chat_type: 'supergroup', chat_id: '-1001', directed: false });
  await database.record({ user_id: '102', event_key: 'msg:-1001:2', chat_type: 'supergroup', chat_id: '-1001', directed: false });
  await database.record({ user_id: '103', event_key: 'cb:103', kind: 'callback', chat_type: 'group', chat_id: '-1002' });
  await database.record({ user_id: '100', token_id: 12, event_key: 'cb:104', kind: 'callback', chat_type: 'group', chat_id: '-1001', occurred_at: '2026-10-21T12:00:00Z' });
});
afterAll(() => database.cleanup());
/** Читает общий отчёт либо одного бота без изменения фактов. */
async function snapshot(token: number | null = 11) {
  const client = await database.pool.connect();
  try { return await readAnalyticsV2Snapshot(client, 1, token, { from: '2026-10-20T00:00:00Z', to: '2026-10-23T00:00:00Z' }, Date.parse('2026-11-01')); }
  finally { client.release(); }
}
it('показывает первую группу, не засчитывает поздний callback и обычную переписку', async () => {
  const value = await snapshot();
  expect(value.sources.find(s => s.id === 'group:11:-1001')).toMatchObject({ label: 'Группа · Общение', new_users: 1 });
  expect(value.sources.find(s => s.id === 'group:11:-1002')).toMatchObject({ label: 'Группа · -1002', new_users: 1 });
  expect(value.current.audience.total_users).toBe(3);
  /** Два обычных сообщения одного автора дают одного человека, но сохраняют число сообщений. */
  expect(value.leaders.groups_observed.find(g => g.id === '-1001')).toMatchObject({ people: 1, messages: 2, total: 2 });
  expect(value.leaders.groups_messages?.find(g => g.id === '-1001')).toMatchObject({ people: 1, messages: 2, total: 2 });
  /** Первое личное сообщение без источника не остаётся неизвестным из-за отсутствия /start. */
  expect(value.sources.find(s => s.id === 'no_marker')?.new_users).toBe(1);
  /** Селектор получает всех ботов текущего проекта, не подмешивая чужие профили. */
  expect(value.token_audiences).toEqual(expect.arrayContaining([{ token_id: 11, total_users: 3 }, { token_id: 12, total_users: 1 }]));
  expect(value.token_audiences?.some(item => item.token_id === 21)).toBe(false);
  expect(value.source_points.filter(p => p.id === 'group:11:-1001').reduce((n, p) => n + p.new_users, 0)).toBe(1);
});
it('сохраняет ID при переименовании, разделяет ботов и дедуплицирует человека в проекте', async () => {
  await database.pool.query("UPDATE bot_groups SET name='Новое название' WHERE project_id=1 AND token_id=11");
  expect((await snapshot()).sources.find(s => s.id === 'group:11:-1001')?.label).toBe('Группа · Новое название');
  expect((await snapshot(12)).sources.find(s => s.id === 'group:12:-1001')?.label).toBe('Группа · Другая группа');
  expect((await snapshot(null)).sources.find(s => s.id === 'group:12:-1001')).toBeUndefined();
});
