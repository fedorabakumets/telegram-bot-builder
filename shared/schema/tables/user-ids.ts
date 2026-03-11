/**
 * @fileoverview Таблица ID пользователей для рассылки
 * @module shared/schema/tables/user-ids
 */

import { pgTable, text, serial, timestamp, bigint } from "drizzle-orm/pg-core";
import { z } from "zod";

/**
 * Таблица ID пользователей для рассылки (общая база на все проекты)
 */
export const userIds = pgTable("user_ids", {
  /** Уникальный идентификатор записи */
  id: serial("id").primaryKey(),
  /** ID пользователя в Telegram */
  userId: bigint("user_id", { mode: "number" }).notNull(),
  /** Дата создания записи */
  createdAt: timestamp("created_at").defaultNow(),
  /** Источник добавления */
  source: text("source").default("manual"),
});

/** Схема для вставки ID пользователя */
export const insertUserIdSchema = z.object({
  /** ID пользователя в Telegram */
  userId: z.number(),
});

/** Тип записи ID пользователя */
export type UserId = typeof userIds.$inferSelect;

/** Тип для вставки ID пользователя */
export type InsertUserId = z.infer<typeof insertUserIdSchema>;
