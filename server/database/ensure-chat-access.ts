/** @fileoverview Идемпотентное создание таблицы результатов проверки чатов. */
import { sql } from 'drizzle-orm';
import { db } from './db';

/**
 * Создаёт таблицу без запросов к Telegram и заполнения старых данных.
 * @returns Завершение создания таблицы
 */
export async function ensureChatAccess(): Promise<void> {
  await db.execute(sql.raw(CHAT_ACCESS_DDL));
}

/** Создание таблицы с ограничением состояний и составной уникальностью. */
export const CHAT_ACCESS_DDL = `CREATE TABLE IF NOT EXISTS chat_access (
    project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
    token_id INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('available', 'kicked', 'error')),
    checked_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (project_id, token_id, chat_id)
  )`;
