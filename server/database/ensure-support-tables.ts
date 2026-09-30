/**
 * @fileoverview Создание таблиц чата поддержки платформы при старте сервера
 * @module server/database/ensure-support-tables
 */

import { sql } from "drizzle-orm";
import { db } from "./db";

/** Идемпотентные SQL-запросы создания таблиц и индексов поддержки */
const SUPPORT_TABLE_QUERIES = [
  sql`
    CREATE TABLE IF NOT EXISTS support_threads (
      id SERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL UNIQUE REFERENCES telegram_users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'open',
      unread_by_admin INTEGER NOT NULL DEFAULT 0,
      unread_by_user INTEGER NOT NULL DEFAULT 0,
      telegram_topic_id INTEGER,
      last_message_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `,
  sql`
    CREATE INDEX IF NOT EXISTS support_threads_last_message_idx
      ON support_threads (last_message_at);
  `,
  sql`
    CREATE TABLE IF NOT EXISTS support_messages (
      id SERIAL PRIMARY KEY,
      thread_id INTEGER NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      context JSONB,
      source TEXT NOT NULL DEFAULT 'web',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `,
  sql`
    CREATE INDEX IF NOT EXISTS support_messages_thread_idx
      ON support_messages (thread_id, id);
  `,
  sql`
    CREATE TABLE IF NOT EXISTS support_attachments (
      id SERIAL PRIMARY KEY,
      message_id INTEGER NOT NULL REFERENCES support_messages(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      storage_config_id TEXT NOT NULL,
      storage_key TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `,
  sql`
    CREATE INDEX IF NOT EXISTS support_attachments_message_idx
      ON support_attachments (message_id);
  `,
];

/**
 * Создаёт таблицы support_threads, support_messages и support_attachments, если их нет.
 * Ошибка логируется и не останавливает запуск сервера.
 * @returns Promise без значения
 */
export async function ensureSupportTables(): Promise<void> {
  try {
    for (const query of SUPPORT_TABLE_QUERIES) {
      await db.execute(query);
    }
  } catch (error) {
    console.log("⚠️ Ошибка при создании таблиц поддержки:", error);
  }
}
