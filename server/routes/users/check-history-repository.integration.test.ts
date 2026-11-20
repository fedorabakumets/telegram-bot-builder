/** @fileoverview Настоящий SQL истории: объединение запусков, курсор, область, детали и безопасная проекция. */
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHistoryTestDatabase } from './check-history-test-database';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: { query: mocks.query } }));
import { listCheckHistory, getCheckHistory } from '../check-history/repository';
import { parseHistoryQuery } from '../check-history/query';
const database = createHistoryTestDatabase();
beforeAll(async () => {
  await database.setup();
  await database.pool.query(await readFile('migrations/0043_check_history.sql', 'utf8'));
  mocks.query.mockImplementation((sql, args) => database.pool.query(sql, args));
  await database.pool.query(`INSERT INTO chat_access_check_jobs(project_id,token_id,status,total_count,processed_count,available_count,created_at)
    VALUES(12,9,'completed',3,3,2,'2026-11-17T10:00:00.000100Z'),
    (12,10,'completed',5,5,4,'2026-11-17T10:00:00.000200Z'),
    (12,9,'completed',7,7,6,'2026-11-17T10:00:00.000300Z');
    INSERT INTO chat_access_check_batches(project_id,job_ids,status,created_at)
    VALUES(12,ARRAY[1,2],'completed','2026-11-17T10:00:00.000400Z');
    INSERT INTO telegram_bot_check_runs(project_id,status,total_count,processed_count,available_count,error_count,created_at)
    VALUES(12,'completed',2,1,1,0,'2026-11-17T10:00:00.000500Z');
    INSERT INTO telegram_bot_check_items(run_id,project_id,token_id,status,name)
    VALUES(1,12,9,'available','Первый'),(1,12,10,'pending','Второй');`);
});
afterAll(() => database.cleanup());
/** Группа присутствует один раз, её дочерние очереди не становятся отдельными запусками. */
it('объединяет три вида запусков без дублей дочерних задач', async () => {
  const page = await listCheckHistory(12, { limit: 20 });
  expect(page.items.map(item => item.id)).toEqual(['telegram-bots:1', 'chat-job:3', 'chat-batch:1']);
  expect(page.items.find(item => item.id === 'chat-batch:1')?.summary).toMatchObject({ total: 8, processed: 8, available: 6 });
  expect((await listCheckHistory(13, { limit: 20 })).items).toEqual([]);
});
/** Курсор не теряет микросекундные строки, приведённые к одинаковой миллисекунде. */
it('проходит одинаковые миллисекунды по стабильному составному курсору', async () => {
  const ids: string[] = [];
  let query = { limit: 1 } as ReturnType<typeof parseHistoryQuery>;
  for (let index = 0; index < 4; index++) {
    const page = await listCheckHistory(12, query);
    ids.push(...page.items.map(item => item.id));
    if (!page.nextCursor) break;
    query = parseHistoryQuery({ limit: '1', cursor: page.nextCursor });
  }
  expect(ids).toEqual(['telegram-bots:1', 'chat-job:3', 'chat-batch:1']);
  expect(new Set(ids).size).toBe(3);
});
/** Фильтр бота выбирает группу целиком, сохраняя исходные общие итоги. */
it('фильтрует участие бота и вид без обрезания агрегатов группы', async () => {
  const page = await listCheckHistory(12, { kind: 'private-chats', tokenId: 10, limit: 20 });
  expect(page.items).toHaveLength(1);
  expect(page.items[0]).toMatchObject({ id: 'chat-batch:1', summary: { total: 8, botsTotal: 2 } });
  expect((await listCheckHistory(12, { tokenId: 999, limit: 20 })).items).toEqual([]);
});
/** Детали включают ожидающих ботов; чужие проекты не раскрывают запуск и секретные столбцы не выходят в DTO. */
it('читает все детали безопасно и не изменяет состояние базы', async () => {
  const before = await database.pool.query('SELECT status FROM telegram_bot_check_items ORDER BY token_id');
  const detail = await getCheckHistory(12, 'telegram-bots:1');
  expect(detail?.details).toMatchObject({ items: [{ tokenId: 9, status: 'available' }, { tokenId: 10, status: 'error' }] });
  expect(await getCheckHistory(13, 'telegram-bots:1')).toBeNull();
  expect(await getCheckHistory(12, 'telegram-bots:999')).toBeNull();
  expect((await getCheckHistory(12, 'chat-batch:1'))?.details).toMatchObject({ jobs: [{ tokenId: 9 }, { tokenId: 10 }] });
  expect(JSON.stringify(detail)).not.toMatch(/worker_id|lease_until|authorization_error|"token"/);
  expect((await database.pool.query('SELECT status FROM telegram_bot_check_items ORDER BY token_id')).rows).toEqual(before.rows);
  expect(mocks.query.mock.calls.every(([sql]) => !/^\s*(UPDATE|INSERT|DELETE)/i.test(sql))).toBe(true);
});
/** Истёкшая аренда отображается прерванной, не превращаясь в отказ Telegram и не перезапуская работу. */
it('нормализует потерянного исполнителя одинаково в списке и деталях', async () => {
  await database.pool.query(`INSERT INTO chat_access_check_jobs(project_id,token_id,status,created_at,lease_until)
    VALUES(12,10,'running','2020-01-01T00:00:00Z','2020-01-01T00:01:00Z');
    INSERT INTO telegram_bot_check_runs(project_id,status,total_count,created_at,lease_until)
    VALUES(12,'running',1,'2020-01-01T00:00:00Z','2020-01-01T00:01:00Z');
    INSERT INTO telegram_bot_check_items(run_id,project_id,token_id,status) VALUES(2,12,9,'running');`);
  const list = await listCheckHistory(12, { limit: 20 });
  expect(list.items.find(item => item.id === 'chat-job:4')).toMatchObject({ status: 'failed', failureReason: 'worker_interrupted', finishedAt: '2020-01-01T00:01:00.000Z' });
  expect((await getCheckHistory(12, 'chat-job:4'))?.run.status).toBe('failed');
  expect((await getCheckHistory(12, 'telegram-bots:2'))?.run).toMatchObject({ status: 'failed', failureReason: 'server_interrupted' });
  expect((await database.pool.query('SELECT status FROM telegram_bot_check_runs WHERE id=2')).rows[0].status).toBe('running');
});
