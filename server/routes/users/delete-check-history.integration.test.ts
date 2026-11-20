/** @fileoverview Изолированная PostgreSQL-проверка очистки истории с сохранением активных очередей и чужих данных. */
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHistoryTestDatabase } from './check-history-test-database';
/** Рабочий пул не используется: каждый вызов получает изолированную тестовую схему. */
vi.mock('../../database/db', () => ({ pool: null }));
import { deleteCheckHistory } from '../check-history/delete-history';
const database = createHistoryTestDatabase();
beforeAll(async () => { await database.setup(); await database.pool.query(await readFile('migrations/0043_check_history.sql', 'utf8')); });
afterAll(() => database.cleanup());
/** Удаление группы не превращает её завершённые дочерние задачи в самостоятельные записи истории. */
it('удаляет выбранные завершённые чаты и сохраняет активные, чужие и другой вид', async () => {
  await database.pool.query(`INSERT INTO chat_access_check_jobs(id,project_id,token_id,status) VALUES
    (1,12,9,'completed'),(2,12,10,'completed'),(3,12,9,'running'),(4,13,9,'completed'),(5,12,10,'completed');
    INSERT INTO chat_access_check_batches(project_id,job_ids,status) VALUES(12,ARRAY[1,2],'completed');
    INSERT INTO telegram_bot_check_runs(project_id,status) VALUES(12,'completed');`);
  expect(await deleteCheckHistory(12, 'private-chats', 9, database.pool)).toBe(1);
  expect((await database.pool.query('SELECT id FROM chat_access_check_jobs ORDER BY id')).rows.map(row => row.id)).toEqual([3,4,5]);
  expect((await database.pool.query('SELECT count(*)::int n FROM chat_access_check_batches')).rows[0].n).toBe(0);
  expect((await database.pool.query('SELECT count(*)::int n FROM telegram_bot_check_runs')).rows[0].n).toBe(1);
});
/** Каскад очищает результаты только завершённых проверок самих ботов. */
it('очищает ботам завершённые результаты, сохраняя активный запуск', async () => {
  await database.pool.query(`INSERT INTO telegram_bot_check_runs(id,project_id,status) VALUES(10,12,'completed'),(11,12,'running'),(12,13,'completed');
    INSERT INTO telegram_bot_check_items(run_id,project_id,token_id,status) VALUES(10,12,9,'available'),(11,12,9,'pending'),(12,13,9,'available');`);
  expect(await deleteCheckHistory(12, 'telegram-bots', 9, database.pool)).toBe(1);
  expect((await database.pool.query('SELECT run_id FROM telegram_bot_check_items ORDER BY run_id')).rows.map(row => row.run_id)).toEqual([11,12]);
});
