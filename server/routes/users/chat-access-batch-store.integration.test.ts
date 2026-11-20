/** @fileoverview Реальная проверка атомарного резервирования всех очередей и изоляции проектов. */
import { beforeAll, afterAll, beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../database/db', () => ({ pool: undefined }));
import { createImportTestDatabase } from './import-users-test-database';
import { createChatAccessBatchStore } from '../dialogs/chat-access-batch-store';
const database = createImportTestDatabase();
const store = createChatAccessBatchStore(database.pool);
beforeAll(async () => {
  await database.setup();
  await database.pool.query(`CREATE TABLE bot_projects(id integer PRIMARY KEY,name text); INSERT INTO bot_projects VALUES(12,'Проект');
    CREATE TABLE bot_tokens(id integer PRIMARY KEY,project_id integer,name text,bot_first_name text,bot_username text);
    INSERT INTO bot_tokens VALUES(9,12,'Бот А',NULL,'first'),(10,12,'Бот Б',NULL,'second');
    CREATE TABLE chat_access_check_jobs(id serial PRIMARY KEY,project_id integer,token_id integer,status text,
    total_count integer DEFAULT 0,processed_count integer DEFAULT 0,available_count integer DEFAULT 0,kicked_count integer DEFAULT 0,
    deleted_count integer DEFAULT 0,error_count integer DEFAULT 0,started_at timestamptz,finished_at timestamptz,created_at timestamptz DEFAULT now(),
    token_name text,token_username text,historical_token_id integer,project_name text,failure_reason text,worker_id text,lease_until timestamptz);
    CREATE UNIQUE INDEX one_active_job ON chat_access_check_jobs(project_id,token_id) WHERE status IN ('pending','running','cancelling');`);
  await store.get(12);
});
beforeEach(async () => { await database.pool.query('TRUNCATE chat_access_check_batches,chat_access_check_jobs RESTART IDENTITY'); });
afterAll(() => database.cleanup());
/** Две одновременные команды не создают дубликатов или частичных групп. */
it('атомарно резервирует задачи и восстанавливает группу по проекту', async () => {
  const results = await Promise.all([store.create(12, [{ tokenId: 9, total: 3 }, { tokenId: 10, total: 5 }]),
    store.create(12, [{ tokenId: 9, total: 3 }, { tokenId: 10, total: 5 }])]);
  expect(results.filter(Boolean)).toHaveLength(1);
  const batch = await store.get(12);
  expect(batch?.jobs.map(job => [job.tokenId, job.totalCount, job.status])).toEqual([[9, 3, 'pending'], [10, 5, 'pending']]);
  expect(await store.get(13, batch!.id)).toBeNull();
  expect((await database.pool.query('SELECT COUNT(*)::int count FROM chat_access_check_jobs')).rows[0].count).toBe(2);
});
/** Уже идущая одиночная проверка не оставляет зарезервированные очереди остальных ботов. */
it('не начинает частичную проверку при занятом боте', async () => {
  await database.pool.query("INSERT INTO chat_access_check_jobs(project_id,token_id,status) VALUES(12,10,'running')");
  expect(await store.create(12, [{ tokenId: 9, total: 3 }, { tokenId: 10, total: 5 }])).toBeNull();
  expect((await database.pool.query('SELECT token_id FROM chat_access_check_jobs')).rows).toEqual([{ token_id: 10 }]);
  expect(await store.get(12)).toBeNull();
});

/** Снимок имени не меняется при переименовании бота, завершение получает время. */
it('сохраняет снимок и времена группы', async () => {
  const batch = await store.create(12,[{ tokenId:9,total:3 }]);
  expect(await store.claim(12,batch!.id,'worker-a')).toBe(true);
  expect(await store.claim(12,batch!.id,'worker-b')).toBe(false);
  await database.pool.query("UPDATE bot_tokens SET name='Новое имя' WHERE id=9");
  const snapshot = await database.pool.query('SELECT token_name,token_username,historical_token_id FROM chat_access_check_jobs');
  expect(snapshot.rows[0]).toEqual({ token_name:'Бот А',token_username:'first',historical_token_id:9 });
  await store.setStatus(12,batch!.id,'failed','partial_failure');
  const saved = await database.pool.query('SELECT started_at,finished_at,failure_reason FROM chat_access_check_batches');
  expect(saved.rows[0].started_at).toBeInstanceOf(Date);
  expect(saved.rows[0].finished_at).toBeInstanceOf(Date);
  expect(saved.rows[0].failure_reason).toBe('partial_failure');
});
/** Живое владение защищает группу, истёкшее прерывается с сохранением счётчиков. */
it('восстанавливает только истёкшую аренду', async () => {
  const batch = await store.create(12,[{ tokenId:9,total:3 }]);
  await store.claim(12,batch!.id,'worker-a'); await store.failExpired(12);
  expect((await store.get(12))?.status).toBe('running');
  await database.pool.query("UPDATE chat_access_check_batches SET lease_until=now()-interval '1 second'");
  await database.pool.query('UPDATE chat_access_check_jobs SET processed_count=2,error_count=1');
  /** Чтение показывает прерывание, но не меняет сохранённый статус. */
  expect((await store.get(12))?.status).toBe('failed');
  expect((await database.pool.query('SELECT status FROM chat_access_check_batches')).rows[0].status).toBe('running');
  await store.failExpired(12);
  const saved = await store.get(12);
  expect(saved?.status).toBe('failed');
  expect(saved?.jobs[0]).toMatchObject({ status:'failed',processedCount:2,errorCount:1 });
});
