/**
 * @fileoverview Задачи массовой проверки доступа к личным чатам.
 * @module shared/schema/tables/chat-access-check-jobs
 */
import { pgTable, serial, integer, text, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { botProjects } from './bot-projects';
import { botTokens } from './bot-tokens';

/** Фоновая сверка доступности личных диалогов одного бота. */
export const chatAccessCheckJobs = pgTable('chat_access_check_jobs', {
  /** Идентификатор задачи. */
  id: serial('id').primaryKey(),
  /** Проект. */
  projectId: integer('project_id').notNull().references(() => botProjects.id, { onDelete: 'cascade' }),
  /** Токен бота. */
  tokenId: integer('token_id').notNull().references(() => botTokens.id, { onDelete: 'cascade' }),
  /** pending | running | cancelling | cancelled | completed | failed. */
  status: text('status').notNull().default('pending'),
  /** Сколько личных диалогов в очереди. */
  totalCount: integer('total_count').notNull().default(0),
  /** Сколько уже проверено. */
  processedCount: integer('processed_count').notNull().default(0),
  /** Доступны. */
  availableCount: integer('available_count').notNull().default(0),
  /** Заблокировали бота. */
  kickedCount: integer('kicked_count').notNull().default(0),
  /** Аккаунт удалён или чат не найден. */
  deletedCount: integer('deleted_count').notNull().default(0),
  /** Прочие ошибки отдельных запросов. */
  errorCount: integer('error_count').notNull().default(0),
  /** Время старта. */
  startedAt: timestamp('started_at', { withTimezone: true }),
  /** Время завершения. */
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  /** Время создания записи. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('chat_access_check_jobs_status_check', sql`${table.status} IN ('pending', 'running', 'cancelling', 'cancelled', 'completed', 'failed')`),
]);
