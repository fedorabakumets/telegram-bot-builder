/** @fileoverview Реальные SQL-проверки идемпотентности, классификации, атрибуции и независимого хранения. */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
const database = createAnalyticsTestDatabase();
beforeAll(async () => {
  await database.setup();
  await database.pool.query("INSERT INTO analytics_sources(id,project_id,name) VALUES(7,1,'Первый'),(8,1,'Поздний'),(9,1,'Ранний'),(10,1,'Повторный')");
  await database.pool.query("INSERT INTO bot_users(project_id,token_id,user_id) VALUES(1,11,90); SELECT mark_analytics_runtime_v2(1,11); SELECT mark_analytics_runtime_v2(1,12)");
});
afterAll(() => database.cleanup());
describe('Атомарная запись событий', () => {
  it('считает повтор один раз и сохраняет только безопасную метаинформацию', async () => {
    const payload = { metadata: { button_label: 'Меню', entry: true, raw_login_code: 'link_secret' }, source_id: 7 };
    const first = await database.record(payload);
    const second = await database.record(payload);
    expect(first.inserted).toBe(true); expect(second).toEqual({ ...first, inserted: false });
    const { rows: [event] } = await database.pool.query('SELECT * FROM analytics_events_v2 WHERE id=$1', [first.event_id]);
    expect(event.metadata).toEqual({ button_label: 'Меню', entry: true });
    expect(JSON.stringify(event)).not.toContain('link_secret');
    const { rows: [count] } = await database.pool.query('SELECT SUM(event_count) count FROM analytics_daily_v2');
    expect(count.count).toBe('1');
  });
  it('сериализует конкурентные первые взаимодействия и сохраняет ранний источник', async () => {
    await Promise.all([database.record({ event_key: 'msg:43:2', user_id: '43', source_id: 8, occurred_at: '2026-10-21T00:00:00Z' }),
      database.record({ event_key: 'msg:43:1', user_id: '43', source_id: 9, occurred_at: '2026-10-19T00:00:00Z' })]);
    const { rows } = await database.pool.query("SELECT * FROM analytics_audience_v2 WHERE user_id='43'");
    expect(rows).toHaveLength(1); expect(rows[0].source_id).toBe(9);
    await database.record({ event_key: 'msg:43:3', user_id: '43', source_id: 10, occurred_at: '2026-10-22T00:00:00Z' });
    expect((await database.pool.query("SELECT source_id FROM analytics_audience_v2 WHERE user_id='43'")).rows[0].source_id).toBe(9);
  });
  it('не превращает групповую переписку и исходящие в пользователей', async () => {
    await database.record({ event_key: 'msg:-100:1', user_id: '44', chat_id: '-100', chat_type: 'group', directed: false });
    await database.record({ event_key: 'msg_out:44:2', user_id: '44', kind: 'message_out', directed: true });
    expect((await database.pool.query("SELECT * FROM analytics_audience_v2 WHERE user_id='44'")).rowCount).toBe(0);
    await database.record({ event_key: 'cb:44', user_id: '44', kind: 'callback' });
    expect((await database.pool.query("SELECT * FROM analytics_audience_v2 WHERE user_id='44'")).rowCount).toBe(1);
  });
  it('отмечает старые профили неизвестными и отклоняет самореферала', async () => {
    await database.record({ event_key: 'msg:90:1', user_id: '90', referrer_id: '90' });
    const { rows: [person] } = await database.pool.query("SELECT * FROM analytics_audience_v2 WHERE user_id='90'");
    expect(person.first_known).toBe(false); expect(person.referrer_id).toBeNull();
  });
  it('отклоняет чужой токен и откатывает все изменения при ошибке', async () => {
    await expect(database.record({ token_id: 21 })).rejects.toMatchObject({ code: '42501' });
    const before = (await database.pool.query('SELECT revision FROM analytics_versions_v2 WHERE project_id=1')).rows[0].revision;
    await expect(database.record({ event_key: 'invalid:chat', chat_id: 'not-a-number' })).rejects.toMatchObject({ code: '23514' });
    expect((await database.pool.query('SELECT revision FROM analytics_versions_v2 WHERE project_id=1')).rows[0].revision).toBe(before);
  });
  it('очистка переписки сохраняет факты, а удаление человека убирает его следы', async () => {
    await database.pool.query('DELETE FROM bot_messages WHERE project_id=1');
    expect((await database.pool.query('SELECT COUNT(*) count FROM analytics_events_v2')).rows[0].count).not.toBe('0');
    await database.pool.query("INSERT INTO user_activity_daily(project_id,token_id,user_id,day) VALUES(1,11,90,CURRENT_DATE); DELETE FROM bot_users WHERE user_id=90");
    for (const table of ['analytics_audience_v2', 'analytics_events_v2', 'analytics_legacy_people_v2', 'user_activity_daily']) {
      expect((await database.pool.query(`SELECT * FROM ${table} WHERE user_id::text='90'`)).rowCount).toBe(0);
    }
  });
});
