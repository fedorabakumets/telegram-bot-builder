/**
 * @fileoverview Идемпотентное создание таблицы задач массовой проверки доступа.
 * @module server/database/ensure-chat-access-check-jobs
 */
import { sql } from 'drizzle-orm';
import { db } from './db';

/** Таблица задач массовой проверки. */
export const CHAT_ACCESS_CHECK_JOBS_DDL = `CREATE TABLE IF NOT EXISTS chat_access_check_jobs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES bot_projects(id) ON DELETE CASCADE,
    token_id INTEGER NOT NULL REFERENCES bot_tokens(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'running', 'cancelling', 'cancelled', 'completed', 'failed')),
    total_count INTEGER NOT NULL DEFAULT 0,
    processed_count INTEGER NOT NULL DEFAULT 0,
    available_count INTEGER NOT NULL DEFAULT 0,
    kicked_count INTEGER NOT NULL DEFAULT 0,
    deleted_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

/** Одна активная задача на пару проект и токен. */
export const CHAT_ACCESS_CHECK_JOBS_INDEX_DDL = `CREATE UNIQUE INDEX IF NOT EXISTS chat_access_check_jobs_one_active
  ON chat_access_check_jobs (project_id, token_id)
  WHERE status IN ('pending', 'running', 'cancelling')`;

/**
 * Создаёт таблицу задач, не обращаясь к Telegram.
 * @returns Завершение DDL
 */
export async function ensureChatAccessCheckJobs(): Promise<void> {
  await db.execute(sql.raw(CHAT_ACCESS_CHECK_JOBS_DDL));
  await db.execute(sql.raw(CHAT_ACCESS_CHECK_JOBS_INDEX_DDL));
}
