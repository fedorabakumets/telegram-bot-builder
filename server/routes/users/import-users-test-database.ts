/** @fileoverview Изолированная схема PostgreSQL для проверки импорта без изменения данных приложения. */
import 'dotenv/config';
import { Pool } from 'pg';
/** Создаёт отдельные тестовые таблицы и пул с ограниченным путём поиска. @returns Жизненный цикл схемы. */
export function createImportTestDatabase() {
  const schema = `users_import_test_${process.pid}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const connectionString = process.env.USERS_TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Для теста требуется локальная база PostgreSQL');
  /** Обычный адрес приложения допустим только локально; удалённый тестовый задаётся явно. */
  if (!process.env.USERS_TEST_DATABASE_URL && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(connectionString).hostname)) {
    throw new Error('Для удалённой тестовой базы требуется отдельный USERS_TEST_DATABASE_URL');
  }
  const admin = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
  const pool = new Pool({ connectionString, options: `-c search_path=${schema} -c timezone=UTC`, connectionTimeoutMillis: 5000 });
  /** Копирует только структуру профилей; реальные строки остаются нетронутыми. */
  async function setup() {
    await admin.query(`CREATE SCHEMA ${schema}`);
    await pool.query(`CREATE TABLE bot_users (LIKE public.bot_users INCLUDING ALL);
      ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS imported_at timestamptz;
      CREATE TABLE bot_messages(project_id integer,token_id integer,user_id text,chat_type text);`);
  }
  /** Удаляет исключительно созданную этим тестом схему. */
  async function cleanup() {
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
  return { pool, setup, cleanup };
}
