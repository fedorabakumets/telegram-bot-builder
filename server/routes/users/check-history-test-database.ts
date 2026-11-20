/** @fileoverview Изолированная схема PostgreSQL для проверки миграции истории без рабочих данных. */
import 'dotenv/config';
import { Pool } from 'pg';
/** Создаёт отдельную схему и ограничивает все запросы её путём поиска. @returns Пул и жизненный цикл схемы. */
export function createHistoryTestDatabase() {
  const schema = `check_history_test_${process.pid}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const connectionString = process.env.USERS_TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Нужна локальная PostgreSQL для интеграционной проверки');
  if (!process.env.USERS_TEST_DATABASE_URL && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(connectionString).hostname))
    throw new Error('Удалённая тестовая база задаётся только через USERS_TEST_DATABASE_URL');
  const admin = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
  const pool = new Pool({ connectionString, options: `-c search_path=${schema} -c timezone=UTC`, connectionTimeoutMillis: 5000 });
  /** Создаёт исключительно собственную схему и минимальных родителей. */
  async function setup() {
    await admin.query(`CREATE SCHEMA ${schema}`);
    await pool.query(`CREATE TABLE bot_projects(id integer PRIMARY KEY,name text);
      CREATE TABLE bot_tokens(id integer PRIMARY KEY,project_id integer REFERENCES bot_projects(id) ON DELETE CASCADE,
      name text,bot_first_name text,bot_username text);
      INSERT INTO bot_projects VALUES(12,'Проект'),(13,'Чужой');
      INSERT INTO bot_tokens VALUES(9,12,'Первый','Первый','first_bot'),(10,12,'Второй','Второй','second_bot');`);
  }
  /** Удаляет только схему, имя которой создано этим экземпляром теста. */
  async function cleanup() {
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
  return { pool, schema, setup, cleanup };
}
