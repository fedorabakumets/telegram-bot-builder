/**
 * @fileoverview Таблица пользователей бота и схема вставки с поддержкой tokenId
 * @module shared/schema/tables/bot-users
 */

import { pgTable, text, integer, jsonb, timestamp, bigint, primaryKey } from "drizzle-orm/pg-core";
import { z } from "zod";

/**
 * Таблица пользователей бота
 */
export const botUsers = pgTable("bot_users", {
  /** Идентификатор пользователя в Telegram */
  userId: bigint("user_id", { mode: "number" }).notNull(),
  /** Идентификатор проекта */
  projectId: integer("project_id").notNull().default(0),
  /** Идентификатор токена бота для сегментации базы */
  tokenId: integer("token_id").notNull().default(0),
  /** Имя пользователя в Telegram */
  username: text("username"),
  /** Имя пользователя */
  firstName: text("first_name"),
  /** Фамилия пользователя */
  lastName: text("last_name"),
  /** URL аватарки пользователя */
  avatarUrl: text("avatar_url"),
  /** Флаг бота: 0 - человек, 1 - бот */
  isBot: integer("is_bot").default(0),
  /** Дата регистрации */
  registeredAt: timestamp("registered_at").defaultNow(),
  /** Дата последнего взаимодействия */
  lastInteraction: timestamp("last_interaction").defaultNow(),
  /** Количество взаимодействий */
  interactionCount: integer("interaction_count").default(0),
  /** Пользовательские данные */
  userData: jsonb("user_data").default({}),
  /** Флаг активности: 0 - неактивен, 1 - активен */
  isActive: integer("is_active").default(1),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.projectId, table.tokenId] }),
}));

/** Схема вставки пользователя бота */
export const insertBotUserSchema = z.object({
  /** Идентификатор пользователя в Telegram */
  userId: z.number().positive("ID пользователя должен быть положительным числом"),
  /** Идентификатор проекта */
  projectId: z.number().int().default(0),
  /** Идентификатор токена бота */
  tokenId: z.number().int().min(0).default(0),
  /** Имя пользователя в Telegram */
  username: z.string().nullable().optional(),
  /** Имя пользователя */
  firstName: z.string().nullable().optional(),
  /** Фамилия пользователя */
  lastName: z.string().nullable().optional(),
  /** Количество взаимодействий */
  interactionCount: z.number().min(0).default(0),
  /** Пользовательские данные */
  userData: z.record(z.any()).default({}),
  /** Флаг активности: 0 - неактивен, 1 - активен */
  isActive: z.number().min(0).max(1).default(1),
});

/** Тип записи пользователя бота */
export type BotUser = typeof botUsers.$inferSelect;

/** Тип для вставки пользователя бота */
export type InsertBotUser = z.infer<typeof insertBotUserSchema>;
