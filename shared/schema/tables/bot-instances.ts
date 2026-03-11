/**
 * @fileoverview Таблица запущенных экземпляров ботов
 * @module shared/schema/tables/bot-instances
 */

import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { botProjects } from "./bot-projects";
import { botTokens } from "./bot-tokens";

/**
 * Таблица запущенных экземпляров ботов
 *
 * ВАЖНО: После изменения этой схемы необходимо применить миграцию к базе данных!
 */
export const botInstances = pgTable("bot_instances", {
  /** Уникальный идентификатор экземпляра */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор токена (ссылка на bot_tokens.id) */
  tokenId: integer("token_id").references(() => botTokens.id, { onDelete: "cascade" }).notNull(),
  /** Статус экземпляра ("running", "stopped", "error") */
  status: text("status").notNull(),
  /** Токен бота */
  token: text("token").notNull(),
  /** Идентификатор процесса (если бот запущен) */
  processId: text("process_id"),
  /** Время запуска экземпляра */
  startedAt: timestamp("started_at").defaultNow(),
  /** Время остановки экземпляра */
  stoppedAt: timestamp("stopped_at"),
  /** Сообщение об ошибке (если есть) */
  errorMessage: text("error_message"),
});

/** Схема для вставки данных экземпляра бота */
export const insertBotInstanceSchema = createInsertSchema(botInstances).pick({
  projectId: true,
  tokenId: true,
  status: true,
  token: true,
  processId: true,
  errorMessage: true,
  startedAt: true,
  stoppedAt: true,
});

/** Тип записи экземпляра бота */
export type BotInstance = typeof botInstances.$inferSelect;

/** Тип для вставки экземпляра бота */
export type InsertBotInstance = z.infer<typeof insertBotInstanceSchema>;
