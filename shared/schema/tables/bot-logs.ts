/**
 * @fileoverview Таблица логов ботов
 * @module shared/schema/tables/bot-logs
 */

import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

import { botProjects } from "./bot-projects";
import { botTokens } from "./bot-tokens";
import { botLaunchHistory } from "./bot-launch-history";

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
  /** Идентификатор запуска (ссылка на bot_launch_history.id) */
  launchId: integer("launch_id")
    .references(() => botLaunchHistory.id, { onDelete: "set null" }),
  /** Содержимое строки лога */
  content: text("content").notNull(),
  /** Тип строки лога: stdout, stderr или status */
  type: text("type").notNull().default("stdout"),
  /** Временная метка создания записи */
  timestamp: timestamp("timestamp").defaultNow(),
});

/** Схема для вставки записи лога */
export const insertBotLogSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number().int(),
  /** Идентификатор токена */
  tokenId: z.number().int(),
  /** Содержимое строки лога */
  content: z.string().min(1, "Содержимое лога обязательно"),
  /** Тип строки лога */
  type: z.enum(["stdout", "stderr", "status"]).default("stdout"),
  /** Идентификатор запуска (опционально) */
  launchId: z.number().int().nullable().optional(),
  /** Временная метка создания записи */
  timestamp: z.date().optional(),
});

/** Тип записи лога бота */
export type BotLog = typeof botLogs.$inferSelect;

/** Тип для вставки записи лога бота */
export type InsertBotLog = z.infer<typeof insertBotLogSchema>;
