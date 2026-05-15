/**
 * @fileoverview Таблица пользовательских переменных окружения бота
 * @module shared/schema/tables/bot-env-variables
 */

import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

import { botTokens } from "./bot-tokens";

/**
 * Таблица пользовательских переменных окружения бота
 * Хранит кастомные key=value переменные, привязанные к конкретному токену
 */
export const botEnvVariables = pgTable("bot_env_variables", {
  /** Уникальный идентификатор записи */
  id: serial("id").primaryKey(),
  /** Идентификатор токена (ссылка на bot_tokens.id) */
  tokenId: integer("token_id").references(() => botTokens.id, { onDelete: "cascade" }).notNull(),
  /** Имя переменной (KEY) — только A-Z, 0-9, _ */
  key: text("key").notNull(),
  /** Значение переменной */
  value: text("value").notNull().default(""),
  /** Флаг секретности (1 = скрывать значение, 0 = показывать) */
  isSecret: integer("is_secret").default(0),
  /** Дата создания */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Схема валидации для создания переменной окружения */
export const insertBotEnvVariableSchema = z.object({
  /** Идентификатор токена */
  tokenId: z.number().int(),
  /** Имя переменной (только заглавные буквы, цифры и подчёркивание) */
  key: z.string()
    .min(1, "Имя переменной обязательно")
    .max(100, "Имя переменной слишком длинное")
    .regex(/^[A-Z][A-Z0-9_]*$/, "Только A-Z, 0-9 и _ (начинается с буквы)"),
  /** Значение переменной */
  value: z.string().default(""),
  /** Флаг секретности (0 или 1) */
  isSecret: z.number().min(0).max(1).default(0),
});

/** Тип записи переменной окружения */
export type BotEnvVariable = typeof botEnvVariables.$inferSelect;

/** Тип для вставки переменной окружения */
export type InsertBotEnvVariable = typeof botEnvVariables.$inferInsert;
