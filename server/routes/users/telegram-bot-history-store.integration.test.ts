/** @fileoverview Реальная проверка сохранения истории, атомарности и аренды в изолированной схеме PostgreSQL. */
import { readFile } from 'node:fs/promises';
import { beforeAll, afterAll, beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../database/db', () => ({ pool: undefined }));
import { createImportTestDatabase } from './import-users-test-database';
import { createTelegramBotHistoryStore } from './telegram-bot-history-store';
const database = createImportTestDatabase();
const store = createTelegramBotHistoryStore(database.pool);
/** Безопасный снимок области не содержит токенов. */
const input = { projectId: 12, projectName: 'Проект', scopeTokenId: null, workerId: 'worker-a',
  tokens: [{ id: 9, name: 'Первый', botUsername: 'first_bot' }, { id: 10, name: 'Второй' }] };
beforeAll(async () => {
  await database.setup();
  await database.pool.query("CREATE TABLE bot_projects(id integer PRIMARY KEY,name text); INSERT INTO bot_projects VALUES(12,'Проект'),(13,'Другой')");
  const migration = await readFile('migrations/0043_check_history.sql', 'utf8');
  await database.pool.query(migration.slice(migration.indexOf('CREATE TABLE IF NOT EXISTS telegram_bot_check_runs')));
});
beforeEach(async () => { await database.pool.query('TRUNCATE telegram_bot_check_runs CASCADE'); });
afterAll(() => database.cleanup());
/** Все ожидающие строки сохранены до запросов, повтор области присоединяется, перекрытие отклоняется. */
it('резервирует все элементы атомарно и дедуплицирует конкурентные запуски', async () => {
  const created = await Promise.all([store.create(input), store.create({ ...input, workerId: 'worker-b' })]);
  expect(created.filter(result => result.created)).toHaveLength(1);
  expect(created[0].run.id).toBe(created[1].run.id);
  expect((await database.pool.query('SELECT status FROM telegram_bot_check_items')).rows).toEqual([{ status: 'pending' }, { status: 'pending' }]);
  await expect(store.create({ ...input, scopeTokenId: 9, tokens: [input.tokens[0]] })).rejects.toMatchObject({ status: 409 });
  expect((await database.pool.query('SELECT count(*)::integer n FROM telegram_bot_check_runs')).rows[0].n).toBe(1);
});
/** Результаты четырёх worker не теряют счётчики, а чужая область не читается. */
it('сохраняет параллельные результаты и окончательный снимок без секретов', async () => {
  const { run } = await store.create(input);
  await Promise.all([store.saveItem(12, run.id, 'worker-a', { tokenId: 9, status: 'available', method: 'setMyCommands', name: 'secret' }),
    store.saveItem(12, run.id, 'worker-a', { tokenId: 10, status: 'unavailable', reason: 'telegram_frozen', method: 'getMyCommands', errorCode: 400 })]);
  const finished = await store.finish(12, run.id, 'worker-a');
  expect(finished).toMatchObject({ status: 'completed', total: 2, result: { available: 1, unavailable: 1, errors: 0 } });
  expect(finished.finishedAt).toBeTruthy();
  expect(finished.result.items[0].name).toBe('Первый');
  expect(JSON.stringify(finished)).not.toContain('secret');
  expect(await store.get(13, run.id)).toBeNull();
  expect(await store.getActive(12)).toBeNull();
  expect((await store.saveItem(12, run.id, 'worker-a', { tokenId: 9, status: 'available', method: 'setMyCommands' })).result.available).toBe(1);
  await expect(store.saveItem(12, run.id, 'worker-a', { tokenId: 9, status: 'error' })).rejects.toThrow('отличается');
});
/** Только владелец живой аренды изменяет запуск; частичная история не превращается в полную после сбоя. */
it('сохраняет частичные итоги при истечении аренды и разрешает новый запуск', async () => {
  const { run } = await store.create(input);
  expect(await store.heartbeat(12, run.id, 'другой')).toBe(false);
  expect(await store.heartbeat(12, run.id, 'worker-a')).toBe(true);
  await store.saveItem(12, run.id, 'worker-a', { tokenId: 9, status: 'available' });
  await database.pool.query("UPDATE telegram_bot_check_runs SET lease_until=now()-interval '1 second' WHERE id=$1", [run.id]);
  expect(await store.getActive(12)).toBeNull();
  await store.interruptExpired(12);
  const interrupted = await store.get(12, run.id);
  expect(interrupted).toMatchObject({ status: 'failed', failureReason: 'server_interrupted', result: { available: 1, errors: 0 } });
  expect(interrupted?.result.items).toHaveLength(1);
  expect((await database.pool.query('SELECT processed_count FROM telegram_bot_check_runs WHERE id=$1', [run.id])).rows[0].processed_count).toBe(1);
  await expect(store.saveItem(12, run.id, 'worker-a', { tokenId: 10, status: 'available' })).rejects.toThrow('Аренда');
  expect((await store.create(input)).created).toBe(true);
});
/** Живая аренда другого процесса не ошибочно помечается перезапуском. */
it('не прерывает живую аренду и не завершает незаписанные результаты', async () => {
  const { run } = await store.create(input);
  await store.interruptExpired(12);
  expect((await store.getActive(12, 9))?.id).toBe(run.id);
  await expect(store.finish(12, run.id, 'worker-a')).rejects.toThrow('Не все');
  const failed = await store.finish(12, run.id, 'worker-a', 'internal_error');
  expect(failed).toMatchObject({ status: 'failed', result: { available: 0, unavailable: 0, errors: 0, items: [] } });
});
/** Снимок названия берётся из БД и не меняется при последующем переименовании проекта. */
it('сохраняет название проекта без передачи снимка из клиента', async () => {
  const { run } = await store.create({ ...input, projectName: undefined });
  expect(run.projectName).toBe('Проект');
  await database.pool.query("UPDATE bot_projects SET name='Новое' WHERE id=12");
  expect((await store.get(12, run.id))?.projectName).toBe('Проект');
  await database.pool.query("UPDATE bot_projects SET name='Проект' WHERE id=12");
});
