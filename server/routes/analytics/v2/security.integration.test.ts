/** @fileoverview Проверки узких прав runtime, межпроектной изоляции и атомарных уведомлений. */
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createAnalyticsTestDatabase } from './test-database';
const database = createAnalyticsTestDatabase();
beforeAll(() => database.setup());
afterAll(() => database.cleanup());
describe('Границы доступа и транзакций', () => {
  it('даёт runtime только вызов функции своего проекта и бота', async () => {
    const client = await database.pool.connect();
    try {
      await client.query(`SET ROLE ${database.runtimeRole}`);
      await expect(client.query('SELECT * FROM analytics_events_v2')).rejects.toMatchObject({ code: '42501' });
      await expect(client.query('SELECT mark_analytics_runtime_v2(1,11)')).rejects.toMatchObject({ code: '42501' });
      await client.query("SELECT set_config('app.project_id','1',false),set_config('app.token_id','11',false)");
      await client.query('SELECT mark_analytics_runtime_v2(1,11)');
      await expect(client.query('SELECT mark_analytics_runtime_v2(1,12)')).rejects.toMatchObject({ code: '42501' });
      await expect(client.query("SELECT analytics_resolve_link_v2(2,21,'code')")).rejects.toMatchObject({ code: '42501' });
      await expect(client.query("INSERT INTO analytics_sources(project_id,name) VALUES(1,'Недопустимо')")).rejects.toMatchObject({ code: '42501' });
    } finally { await client.query('RESET ROLE'); client.release(); }
  });
  it('не оставляет событие, счётчики или outbox после отката внешней транзакции', async () => {
    const before = (await database.pool.query('SELECT COUNT(*) count FROM analytics_outbox_v2')).rows[0].count;
    const client = await database.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT record_analytics_event_v2($1::jsonb)', [JSON.stringify({ project_id: 1, token_id: 11, kind: 'message_in', event_key: 'msg:999:7',
        user_id: '999', chat_id: '999', chat_type: 'private', directed: true, occurred_at: '2026-10-31T00:00:00Z' })]);
      await client.query('ROLLBACK');
    } finally { client.release(); }
    expect((await database.pool.query('SELECT COUNT(*) count FROM analytics_outbox_v2')).rows[0].count).toBe(before);
    expect((await database.pool.query("SELECT * FROM analytics_events_v2 WHERE user_id='999'")).rowCount).toBe(0);
    expect((await database.pool.query("SELECT * FROM analytics_audience_v2 WHERE user_id='999'")).rowCount).toBe(0);
  });
  it('сохраняет публичную метку и скрывает секрет авторизации во всех допустимых строках', async () => {
    await database.record({ event_key: 'msg:998:1', user_id: '998', observed_tag: 'channel_post_1', purpose: 'start' });
    await database.record({ event_key: 'msg:997:1', user_id: '997', observed_tag: 'link_secret_code', purpose: 'link_secret_code',
      metadata: { button_label: 'Вход link_secret_code', system_kind: 'link_secret_code', callback_data: 'link_secret_code' } });
    const { rows } = await database.pool.query("SELECT observed_tag,purpose,metadata FROM analytics_events_v2 WHERE user_id IN ('997','998') ORDER BY user_id");
    expect(rows[0].observed_tag).toBeNull(); expect(rows[0].purpose).toBeNull();
    expect(JSON.stringify(rows[0])).not.toContain('secret_code');
    expect(rows[1].observed_tag).toBe('channel_post_1');
    expect(rows[1].purpose).toBe('start');
  });
  it('удаление человека очищает его реферальную идентичность в фактах, ссылке и аудите', async () => {
    await database.pool.query(`INSERT INTO bot_users(project_id,token_id,user_id) VALUES(1,11,700);
      INSERT INTO analytics_sources(id,project_id,name) VALUES(1,1,'Канал');
      INSERT INTO analytics_placements(id,project_id,token_id,source_id,name) VALUES(1,1,12,1,'Публикация');
      INSERT INTO analytics_links(id,project_id,token_id,source_id,placement_id,code,purpose,referrer_id) VALUES(1,1,12,1,1,'acq_public','combined','700');
      INSERT INTO analytics_acquisition_audit(project_id,resource,resource_id,after_data) VALUES(1,'links',1,'{"token_id":12,"referrer_id":"700"}')`);
    await database.record({ token_id: 12, event_key: 'msg:701:1', user_id: '701', observed_tag: 'acq_public' });
    expect((await database.pool.query("SELECT referrer_id FROM analytics_events_v2 WHERE user_id='701'")).rows[0].referrer_id).toBe('700');
    await database.pool.query('DELETE FROM bot_users WHERE user_id=700');
    for (const table of ['analytics_events_v2', 'analytics_audience_v2', 'analytics_links']) {
      expect((await database.pool.query(`SELECT * FROM ${table} WHERE referrer_id='700'`)).rowCount).toBe(0);
    }
    expect((await database.pool.query("SELECT after_data->>'referrer_id' referrer FROM analytics_acquisition_audit WHERE resource_id=1")).rows[0].referrer).toBeNull();
    expect((await database.pool.query('SELECT * FROM analytics_placements WHERE id=1')).rowCount).toBe(1);
  });
});
