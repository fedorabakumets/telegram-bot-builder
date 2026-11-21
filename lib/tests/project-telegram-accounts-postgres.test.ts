/** @fileoverview Проверка ограничений миграции Telegram-аккаунтов в изолированной схеме PostgreSQL. */
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const url = process.env.TELEGRAM_ACCOUNTS_TEST_DATABASE_URL;
const schema = `telegram_accounts_test_${randomBytes(8).toString('hex')}`;
let pool: Pool;
let db: PoolClient;

describe.skipIf(!url)('Ограничения PostgreSQL для проектных Telegram-аккаунтов', () => {
  beforeAll(async () => {
    const endpoint = new URL(url!);
    if (!['postgres:', 'postgresql:'].includes(endpoint.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname) || endpoint.searchParams.has('host')) {
      throw new Error('Для проверки миграции требуется локальная PostgreSQL');
    }
    pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5_000 });
    db = await pool.connect();
    await db.query(`
      CREATE SCHEMA ${schema};
      SET search_path TO ${schema};
      CREATE TABLE bot_projects(id integer PRIMARY KEY);
      CREATE TABLE bot_tokens(
        id integer PRIMARY KEY,
        project_id integer NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE
      );
      INSERT INTO bot_projects(id) VALUES (1), (2);
      INSERT INTO bot_tokens(id, project_id) VALUES (5, 1), (62, 1), (81, 2);
    `);
    const migration = await readFile(
      new URL('../../migrations/0048_project_telegram_accounts.sql', import.meta.url), 'utf8',
    );
    await db.query(migration);
    await db.query(`INSERT INTO project_telegram_accounts(id, project_id, name) VALUES
      (101, 1, 'Первый'), (102, 1, 'Второй'), (201, 2, 'Чужой')`);
  });

  afterAll(async () => {
    try {
      if (db) {
        try {
          await db.query('ROLLBACK');
          await db.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        } finally {
          db.release();
        }
      }
    } finally {
      await pool?.end();
    }
  });

  it('разрешает несколько ботов на аккаунт и запрещает межпроектные и повторные привязки', async () => {
    await db.query(`
      INSERT INTO project_telegram_account_bots(bot_token_id, project_id, account_id) VALUES
        (5, 1, 101), (62, 1, 101);
    `);
    /**
     * Пробует добавить привязку в тестовую схему.
     * @param bot - Идентификатор токена.
     * @param project - Идентификатор проекта.
     * @param account - Идентификатор аккаунта.
     * @returns Результат записи PostgreSQL.
     */
    const assignment = (bot: number, project: number, account: number) => db.query(
      'INSERT INTO project_telegram_account_bots(bot_token_id, project_id, account_id) VALUES ($1, $2, $3)',
      [bot, project, account],
    );
    await expect(assignment(81, 2, 101)).rejects.toMatchObject({ code: '23503' });
    await expect(assignment(81, 1, 101)).rejects.toMatchObject({ code: '23503' });
    await expect(assignment(5, 1, 102)).rejects.toMatchObject({ code: '23505' });
    const { rows } = await db.query(
      'SELECT bot_token_id FROM project_telegram_account_bots WHERE account_id = $1 ORDER BY bot_token_id', [101],
    );
    expect(rows).toEqual([{ bot_token_id: 5 }, { bot_token_id: 62 }]);
  });

  it('блокирует повторную запись уже подключённой сессии', async () => {
    /**
     * Сохраняет карточку с заданным синтетическим отпечатком.
     * @param project - Владелец карточки.
     * @returns Результат записи PostgreSQL.
     */
    const insert = (project: number) => db.query(
      'INSERT INTO project_telegram_accounts(project_id, name, session_fingerprint) VALUES ($1, $2, $3)',
      [project, 'Аккаунт', 'синтетический-отпечаток'],
    );
    await expect(insert(1)).resolves.toMatchObject({ rowCount: 1 });
    await expect(insert(2)).rejects.toMatchObject({ code: '23505' });
  });

  it('сохраняет единственную активную миграцию проекта и освобождает слот после завершения', async () => {
    /**
     * Начинает синтетическую попытку переноса.
     * @param id - Ключ операции.
     * @param phase - Этап операции.
     * @returns Результат записи PostgreSQL.
     */
    const insert = (id: string, phase: string) => db.query(
      `INSERT INTO project_telegram_account_cutovers(id, project_id, account_id, bot_ids, phase)
       VALUES ($1, 1, 101, '[5, 62]', $2)`,
      [id, phase],
    );
    await expect(insert('операция-1', 'prepared')).resolves.toMatchObject({ rowCount: 1 });
    await expect(insert('операция-2', 'prepared')).rejects.toMatchObject({ code: '23505' });
    await expect(insert('неизвестный-этап', 'unknown')).rejects.toMatchObject({ code: '23514' });
    await db.query("UPDATE project_telegram_account_cutovers SET phase = 'shared-ready' WHERE id = 'операция-1'");
    await expect(insert('операция-2', 'prepared')).resolves.toMatchObject({ rowCount: 1 });
  });
});
