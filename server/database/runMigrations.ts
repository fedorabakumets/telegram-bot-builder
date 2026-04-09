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
 * SQL для создания таблицы истории запусков ботов
 */
const CREATE_BOT_LAUNCH_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS bot_launch_history (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
    token_id INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'running',
    started_at TIMESTAMP DEFAULT NOW(),
    stopped_at TIMESTAMP,
    error_message TEXT,
    process_id TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_bot_launch_history_token ON bot_launch_history(token_id);
`;

/**
 * SQL для добавления колонки launch_id в таблицу bot_logs
 */
const ADD_LAUNCH_ID_TO_BOT_LOGS = `
  ALTER TABLE bot_logs ADD COLUMN IF NOT EXISTS launch_id INTEGER REFERENCES bot_launch_history(id) ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS idx_bot_logs_launch_id ON bot_logs(launch_id);
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
    await client.query(CREATE_BOT_LAUNCH_HISTORY_TABLE);
    console.log("[Migrations] Таблица bot_launch_history готова");
    await client.query(ADD_LAUNCH_ID_TO_BOT_LOGS);
    console.log("[Migrations] Колонка launch_id в bot_logs готова");
  } catch (err) {
    console.error("[Migrations] Ошибка выполнения миграций:", err);
  } finally {
    client.release();
  }
}
