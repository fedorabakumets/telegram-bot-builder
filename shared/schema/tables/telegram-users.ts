/**
 * @fileoverview Таблица аутентифицированных пользователей Telegram
 * @module shared/schema/tables/telegram-users
 */

import { pgTable, text, timestamp, bigint } from "drizzle-orm/pg-core";
import { z } from "zod";

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
export const insertTelegramUserSchema = z.object({
  /** Уникальный идентификатор пользователя в Telegram */
  id: z.number(),
  /** Имя пользователя */
  firstName: z.string().min(1, "Имя пользователя обязательно"),
  /** Фамилия пользователя */
  lastName: z.string().nullable().optional(),
  /** Имя пользователя в Telegram */
  username: z.string().nullable().optional(),
  /** URL фотографии пользователя */
  photoUrl: z.string().nullable().optional(),
  /** Дата аутентификации */
  authDate: z.number().nullable().optional(),
});

/** Тип записи пользователя Telegram */
export type TelegramUser = typeof telegramUsers.$inferSelect;

/** Тип для вставки пользователя Telegram */
export type InsertTelegramUser = Omit<typeof telegramUsers.$inferInsert, "createdAt" | "updatedAt">;
