/** @fileoverview Сохранённые проверки доступа бота к чатам. */
import { pgTable, integer, text, timestamp, primaryKey, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { botProjects } from './bot-projects';
import { botTokens } from './bot-tokens';

/** Последняя проверка конкретного чата выбранным ботом. */
export const chatAccess = pgTable('chat_access', {
  /** Идентификатор проекта. */
  projectId: integer('project_id').notNull().references(() => botProjects.id, { onDelete: 'cascade' }),
  /** Идентификатор токена. */
  tokenId: integer('token_id').notNull().references(() => botTokens.id, { onDelete: 'cascade' }),
  /** Строковый идентификатор чата Telegram. */
  chatId: text('chat_id').notNull(),
  /** Результат проверки: доступен, исключён или ошибка. */
  status: text('status').notNull(),
  /** Время завершения проверки. */
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull(),
}, (table) => [primaryKey({ columns: [table.projectId, table.tokenId, table.chatId] }),
  check('chat_access_status_check', sql`${table.status} IN ('available', 'kicked', 'error')`)]);
