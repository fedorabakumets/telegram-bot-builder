/**
 * @fileoverview Таблица пользователей бота
 * @module shared/schema/tables/bot-users
 */

import { pgTable, text, integer, jsonb, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Таблица пользователей бота
 */
export const botUsers = pgTable("bot_users", {
  /** Идентификатор пользователя в Telegram */
  userId: bigint("user_id", { mode: "number" }).primaryKey(),
  /** Имя пользователя в Telegram */
  username: text("username"),
  /** Имя пользователя */
  firstName: text("first_name"),
  /** Фамилия пользователя */
  lastName: text("last_name"),
  /** URL аватарки пользователя */
  avatarUrl: text("avatar_url"),
  /** Флаг бота (0 = человек, 1 = бот) */
  isBot: integer("is_bot").default(0),
  /** Дата регистрации пользователя */
  registeredAt: timestamp("registered_at").defaultNow(),
  /** Дата последнего взаимодействия */
  lastInteraction: timestamp("last_interaction").defaultNow(),
  /** Количество взаимодействий */
  interactionCount: integer("interaction_count").default(0),
  /** Пользовательские данные */
  userData: jsonb("user_data").default({}),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: integer("is_active").default(1),
});

/** Схема для вставки данных пользователя бота */
export const insertBotUserSchema = createInsertSchema(botUsers).pick({
  /** Идентификатор пользователя в Telegram */
  userId: true,
  /** Имя пользователя в Telegram */
  username: true,
  /** Имя пользователя */
  firstName: true,
  /** Фамилия пользователя */
  lastName: true,
  /** Количество взаимодействий */
  interactionCount: true,
  /** Пользовательские данные */
  userData: true,
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: true,
}).extend({
  /** Идентификатор пользователя (должен быть положительным числом) */
  userId: z.number().positive("ID пользователя должен быть положительным числом"),
  /** Пользовательские данные */
  userData: z.record(z.any()).default({}),
  /** Флаг активности (0 = неактивен, 1 = активен) */
  isActive: z.number().min(0).max(1).default(1),
  /** Количество взаимодействий */
  interactionCount: z.number().min(0).default(0),
});

/** Тип записи пользователя бота */
export type BotUser = typeof botUsers.$inferSelect;

/** Тип для вставки пользователя бота */
export type InsertBotUser = z.infer<typeof insertBotUserSchema>;
