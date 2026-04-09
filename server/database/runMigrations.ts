/**
 * @fileoverview Запуск миграций базы данных при старте сервера
 * @module server/database/runMigrations
 */

import { pool } from "./db";

/**
 * SQL для создания таблицы логов ботов
 */
const CREATE_BOT_LOGS_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
    token_id INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'stdout',
    timestamp TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_bot_logs_project_token ON bot_logs(project_id, token_id);
  CREATE INDEX IF NOT EXISTS idx_bot_logs_timestamp ON bot_logs(timestamp);
`;

/**
 * Запускает все необходимые миграции базы данных
 * @returns Promise<void>
 */
export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(CREATE_BOT_LOGS_TABLE);
    console.log("[Migrations] Таблица bot_logs готова");
  } catch (err) {
    console.error("[Migrations] Ошибка выполнения миграций:", err);
  } finally {
    client.release();
  }
}
