/**
 * @fileoverview Таблица логов ботов
 * @module shared/schema/tables/bot-logs
 */

import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { botProjects } from "./bot-projects";
import { botTokens } from "./bot-tokens";

/**
 * Таблица логов ботов — хранит строки вывода stdout/stderr/status
 */
export const botLogs = pgTable("bot_logs", {
  /** Уникальный идентификатор записи */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id")
    .references(() => botProjects.id, { onDelete: "cascade" })
    .notNull(),
  /** Идентификатор токена (ссылка на bot_tokens.id) */
  tokenId: integer("token_id")
    .references(() => botTokens.id, { onDelete: "cascade" })
    .notNull(),
  /** Содержимое строки лога */
  content: text("content").notNull(),
  /** Тип строки лога: stdout, stderr или status */
  type: text("type").notNull().default("stdout"),
  /** Временная метка создания записи */
  timestamp: timestamp("timestamp").defaultNow(),
});

/** Схема для вставки записи лога */
export const insertBotLogSchema = createInsertSchema(botLogs).extend({
  /** Тип строки лога */
  type: z.enum(["stdout", "stderr", "status"]).default("stdout"),
});

/** Тип записи лога бота */
export type BotLog = typeof botLogs.$inferSelect;

/** Тип для вставки записи лога бота */
export type InsertBotLog = z.infer<typeof insertBotLogSchema>;
