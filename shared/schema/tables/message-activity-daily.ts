/**
 * @fileoverview Дневные агрегаты активности сообщений (immutable-счётчики)
 * @module shared/schema/tables/message-activity-daily
 */

import { pgTable, integer, date, primaryKey } from "drizzle-orm/pg-core";
import { botProjects } from "./bot-projects";

/**
 * Дневные счётчики входящих/исходящих сообщений.
 * Увеличиваются при записи сообщения; удаление из bot_messages их не уменьшает.
 */
export const messageActivityDaily = pgTable(
  "message_activity_daily",
  {
    /** Идентификатор проекта */
    projectId: integer("project_id")
      .references(() => botProjects.id, { onDelete: "cascade" })
      .notNull(),
    /** Идентификатор токена бота (0 — без сегментации) */
    tokenId: integer("token_id").notNull().default(0),
    /** Календарный день счётчика (как DATE(created_at) в legacy-аналитике) */
    day: date("day", { mode: "date" }).notNull(),
    /** Число входящих сообщений (message_type = user) */
    incomingCount: integer("incoming_count").notNull().default(0),
    /** Число исходящих сообщений (message_type = bot и прочие не-user) */
    outgoingCount: integer("outgoing_count").notNull().default(0),
  },
  (table) => ({
    /** Уникальность слота проект + токен + день */
    pk: primaryKey({
      columns: [table.projectId, table.tokenId, table.day],
    }),
  }),
);

/** Строка дневного агрегата активности */
export type MessageActivityDaily = typeof messageActivityDaily.$inferSelect;
/** Данные для вставки дневного агрегата */
export type InsertMessageActivityDaily = typeof messageActivityDaily.$inferInsert;
