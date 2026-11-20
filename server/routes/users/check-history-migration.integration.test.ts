/** @fileoverview Реальная проверка новой и устаревшей схемы истории в собственных схемах PostgreSQL. */
import { afterAll, beforeAll, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHistoryTestDatabase } from './check-history-test-database';
const fresh = createHistoryTestDatabase(), legacy = createHistoryTestDatabase();
let migration = '';
beforeAll(async () => {
  migration = await readFile('migrations/0043_check_history.sql', 'utf8');
  await fresh.setup(); await legacy.setup();
  await legacy.pool.query(`CREATE TABLE chat_access_check_jobs(
    id serial PRIMARY KEY,project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
    token_id integer NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,status text NOT NULL,
    total_count integer DEFAULT 0,processed_count integer DEFAULT 0,available_count integer DEFAULT 0,
    kicked_count integer DEFAULT 0,deleted_count integer DEFAULT 0,error_count integer DEFAULT 0,
    started_at timestamptz,finished_at timestamptz,created_at timestamptz DEFAULT now());
    CREATE TABLE chat_access_check_batches(id serial PRIMARY KEY,project_id integer NOT NULL,
    job_ids integer[] NOT NULL,status text NOT NULL,created_at timestamptz DEFAULT now());
    INSERT INTO chat_access_check_jobs(project_id,token_id,status,started_at,finished_at)
    VALUES(12,9,'completed','2026-11-17T10:00:00Z','2026-11-17T10:01:00Z');
    INSERT INTO chat_access_check_batches(project_id,job_ids,status) VALUES(12,ARRAY[1],'completed');`);
});
afterAll(async () => { await fresh.cleanup(); await legacy.cleanup(); });
/** Повторное применение не теряет записи и поддерживает ограничения новых таблиц. */
it('создаёт свежую схему и применяется повторно без потери истории', async () => {
  await fresh.pool.query(migration);
  await fresh.pool.query(`INSERT INTO telegram_bot_check_runs(project_id,status,total_count) VALUES(12,'completed',1);
    INSERT INTO telegram_bot_check_items(run_id,project_id,token_id,status,reason,method)
    VALUES(1,12,9,'unavailable','telegram_frozen','getMyCommands');`);
  await fresh.pool.query(migration);
  expect((await fresh.pool.query('SELECT COUNT(*)::int count FROM telegram_bot_check_items')).rows[0].count).toBe(1);
  await expect(fresh.pool.query(`INSERT INTO telegram_bot_check_items(run_id,project_id,token_id,status)
    VALUES(1,13,10,'error')`)).rejects.toMatchObject({ code: '23503' });
  await expect(fresh.pool.query(`INSERT INTO telegram_bot_check_items(run_id,project_id,token_id,status,method)
    VALUES(1,12,10,'error','sendMessage')`)).rejects.toMatchObject({ code: '23514' });
  await fresh.pool.query(`UPDATE bot_tokens SET bot_username=NULL WHERE id=10;
    INSERT INTO chat_access_check_jobs(project_id,token_id,status) VALUES(12,10,'completed');`);
  await fresh.pool.query(migration);
  await fresh.pool.query("UPDATE bot_tokens SET bot_username='new_username' WHERE id=10");
  await fresh.pool.query(migration);
  expect((await fresh.pool.query('SELECT token_username FROM chat_access_check_jobs')).rows[0].token_username).toBeNull();
});
/** Старые даты и подписи восстанавливаются один раз, исторический бот не зависит от удаления токена. */
it('дополняет старую схему, сохраняет снимки и удаляет историю только с проектом', async () => {
  await legacy.pool.query(migration);
  const job = (await legacy.pool.query('SELECT historical_token_id,token_name,token_username FROM chat_access_check_jobs')).rows[0];
  expect(job).toEqual({ historical_token_id: 9, token_name: 'Первый', token_username: 'first_bot' });
  const batch = (await legacy.pool.query('SELECT started_at,finished_at FROM chat_access_check_batches')).rows[0];
  expect(batch.started_at.toISOString()).toBe('2026-11-17T10:00:00.000Z');
  expect(batch.finished_at.toISOString()).toBe('2026-11-17T10:01:00.000Z');
  await legacy.pool.query("UPDATE bot_tokens SET bot_first_name='Новое имя',bot_username='new_bot' WHERE id=9");
  await legacy.pool.query(migration);
  expect((await legacy.pool.query('SELECT token_name FROM chat_access_check_jobs')).rows[0].token_name).toBe('Первый');
  await legacy.pool.query(`INSERT INTO telegram_bot_check_runs(project_id,status,scope_token_id) VALUES(12,'completed',9);
    INSERT INTO telegram_bot_check_items(run_id,project_id,token_id,status,name) VALUES(1,12,9,'available','Первый');
    DELETE FROM bot_tokens WHERE id=9;`);
  expect((await legacy.pool.query('SELECT COUNT(*)::int count FROM chat_access_check_jobs')).rows[0].count).toBe(1);
  expect((await legacy.pool.query('SELECT COUNT(*)::int count FROM telegram_bot_check_items')).rows[0].count).toBe(1);
  await legacy.pool.query('DELETE FROM bot_projects WHERE id=12');
  for (const table of ['chat_access_check_jobs', 'chat_access_check_batches', 'telegram_bot_check_runs', 'telegram_bot_check_items'])
    expect((await legacy.pool.query(`SELECT COUNT(*)::int count FROM ${table}`)).rows[0].count).toBe(0);
});
