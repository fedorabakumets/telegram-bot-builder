/**
 * @fileoverview Таблица аутентифицированных пользователей Telegram
 * @module shared/schema/tables/telegram-users
 */

import { pgTable, text, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod";

/**
 * Таблица аутентифицированных пользователей Telegram
 */
export const telegramUsers = pgTable("telegram_users", {
  /** Уникальный идентификатор пользователя в Telegram */
  id: bigint("id", { mode: "number" }).primaryKey(),
  /** Имя пользователя */
  firstName: text("first_name").notNull(),
  /** Фамилия пользователя */
  lastName: text("last_name"),
  /** Имя пользователя в Telegram (username) */
  username: text("username"),
  /** URL фотографии пользователя */
  photoUrl: text("photo_url"),
  /** Дата аутентификации */
  authDate: bigint("auth_date", { mode: "number" }),
  /** Дата создания записи */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления записи */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Схема для вставки данных пользователя Telegram */
export const insertTelegramUserSchema = createInsertSchema(telegramUsers).omit({
  createdAt: true,
  updatedAt: true,
});

/** Тип записи пользователя Telegram */
export type TelegramUser = typeof telegramUsers.$inferSelect;

/** Тип для вставки пользователя Telegram */
export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
