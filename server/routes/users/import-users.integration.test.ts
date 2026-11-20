/** @fileoverview Настоящие проверки повторного импорта, объединения, отката и видимости новых профилей. */
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
/** Репозиторий получает исключительно изолированный пул, без запуска пула приложения. */
vi.mock('../../database/db', () => ({ pool: undefined }));
import { createImportTestDatabase } from './import-users-test-database';
import { importUsers } from './import-users-repository';
import { uniqueProjectUsersSql } from './unique-project-users';
const database = createImportTestDatabase();
beforeAll(() => database.setup());
afterAll(() => database.cleanup());
beforeEach(async () => { await database.pool.query('TRUNCATE bot_users,bot_messages'); });

/** Повторный файл не создаёт дубли, не изображает взаимодействия и остаётся видимым в общем списке. */
it('импортирует профиль один раз и показывает его без фиктивных сообщений', async () => {
  const users = [{ userId: '123', firstName: 'Иван', userData: { city: 'Москва' } }];
  expect(await importUsers(12, 9, users, false, database.pool)).toMatchObject({ created: 1, applied: false });
  expect((await database.pool.query('SELECT * FROM bot_users')).rowCount).toBe(0);
  expect(await importUsers(12, 9, users, true, database.pool)).toMatchObject({ created: 1, applied: true });
  expect(await importUsers(12, 9, users, true, database.pool)).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
  const { rows } = await database.pool.query('SELECT * FROM bot_users');
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ first_name: 'Иван', is_active: 0, last_interaction: null, interaction_count: 0 });
  expect(rows[0].imported_at).not.toBeNull();
  expect((await database.pool.query('SELECT * FROM bot_messages')).rowCount).toBe(0);
  const visible = await database.pool.query(`SELECT u.user_id::text FROM ${uniqueProjectUsersSql()} u`, [12, null]);
  expect(visible.rows).toEqual([{ user_id: '123' }]);
});

/** Входящий файл заполняет пробелы, сохраняет прежние значения и область другого бота. */
it('бережно объединяет существующий профиль и переменные только целевого бота', async () => {
  await database.pool.query(`INSERT INTO bot_users(user_id,project_id,token_id,first_name,last_name,user_data,is_blocked,interaction_count)
    VALUES(123,12,9,'Прежнее',NULL,'{"city":"Казань","keep":false}',1,7),
      (123,12,10,'Другой бот',NULL,'{"city":"Омск"}',0,3),
      (123,13,9,'Другой проект',NULL,'{}',0,2)`);
  const incoming = [{ userId: '123', firstName: 'Новое', lastName: 'Иванов', userData: { city: 'Москва', extra: 0 } }];
  expect(await importUsers(12, 9, incoming, true, database.pool)).toMatchObject({ created: 0, updated: 1 });
  const { rows } = await database.pool.query('SELECT * FROM bot_users ORDER BY project_id,token_id');
  expect(rows[0]).toMatchObject({ first_name: 'Прежнее', last_name: 'Иванов', user_data: { city: 'Казань', keep: false, extra: 0 }, is_blocked: 1, interaction_count: 7 });
  expect(rows[1]).toMatchObject({ first_name: 'Другой бот', last_name: null, user_data: { city: 'Омск' }, interaction_count: 3 });
  expect(rows[2]).toMatchObject({ first_name: 'Другой проект', last_name: null, interaction_count: 2 });
  expect(await importUsers(12, 9, incoming, true, database.pool)).toMatchObject({ unchanged: 1, updated: 0 });
});

/** Старые групповые профили получают явное происхождение, а нестандартный JSON не повреждается. */
it('делает существующие групповые профили видимыми и сохраняет прежний нестандартный JSON', async () => {
  await database.pool.query(`INSERT INTO bot_users(user_id,project_id,token_id,first_name,user_data)
    VALUES(123,12,9,'Групповой','null'),(456,12,9,'Массив','[1,2]'),(789,12,9,'Строка','"старое"')`);
  await database.pool.query(`INSERT INTO bot_messages VALUES(12,9,'123','group')`);
  const users = ['123', '456', '789'].map(userId => ({ userId, userData: { city: 'Москва' } }));
  expect(await importUsers(12, 9, users, true, database.pool)).toMatchObject({ created: 0, updated: 3 });
  const result = await database.pool.query('SELECT user_data,imported_at FROM bot_users ORDER BY user_id');
  expect(result.rows.map(row => row.user_data)).toEqual([null, [1, 2], 'старое']);
  expect(result.rows.every(row => row.imported_at !== null)).toBe(true);
  const visible = await database.pool.query(`SELECT u.user_id::text FROM ${uniqueProjectUsersSql()} u ORDER BY u.user_id`, [12, null]);
  expect(visible.rows).toEqual([{ user_id: '123' }, { user_id: '456' }, { user_id: '789' }]);
  expect(await importUsers(12, 9, users, true, database.pool)).toMatchObject({ updated: 0, unchanged: 3 });
});

/** Ошибка внутри записи второй строки не оставляет частичный импорт и освобождает соединение. */
it('откатывает предыдущие записи при ошибке второй строки', async () => {
  await database.pool.query(`CREATE FUNCTION reject_import_test() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN
    IF NEW.user_id=456 THEN RAISE EXCEPTION 'Тестовый отказ второй строки'; END IF; RETURN NEW; END$$;
    CREATE TRIGGER reject_import_test BEFORE INSERT OR UPDATE ON bot_users FOR EACH ROW EXECUTE FUNCTION reject_import_test()`);
  try {
    await expect(importUsers(12, 9, [{ userId: '123' }, { userId: '456' }], true, database.pool)).rejects.toThrow('Тестовый отказ');
    expect((await database.pool.query('SELECT * FROM bot_users')).rowCount).toBe(0);
  } finally {
    await database.pool.query('DROP TRIGGER reject_import_test ON bot_users; DROP FUNCTION reject_import_test()');
  }
  expect(await importUsers(12, 9, [{ userId: '789' }], true, database.pool)).toMatchObject({ created: 1 });
});
