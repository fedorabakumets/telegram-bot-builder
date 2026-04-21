/**
 * @fileoverview Таблица истории запусков ботов
 * @module shared/schema/tables/bot-launch-history
 */

import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

import { botProjects } from "./bot-projects";
import { botTokens } from "./bot-tokens";

/**
 * Таблица истории запусков ботов — накапливает все запуски
 */
export const botLaunchHistory = pgTable("bot_launch_history", {
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
  /** Статус запуска: running, stopped или error */
  status: text("status").notNull().default("running"),
  /** Время запуска бота */
  startedAt: timestamp("started_at").defaultNow(),
  /** Время остановки бота (null если ещё работает) */
  stoppedAt: timestamp("stopped_at"),
  /** Сообщение об ошибке (null если нет ошибки) */
  errorMessage: text("error_message"),
  /** Идентификатор системного процесса */
  processId: text("process_id"),
});

/** Схема для вставки записи истории запуска */
export const insertBotLaunchHistorySchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number().int(),
  /** Идентификатор токена */
  tokenId: z.number().int(),
  /** Статус запуска */
  status: z.enum(["running", "stopped", "error"]).default("running"),
  /** Время запуска бота */
  startedAt: z.date().optional(),
  /** Время остановки бота */
  stoppedAt: z.date().nullable().optional(),
  /** Сообщение об ошибке */
  errorMessage: z.string().nullable().optional(),
  /** Идентификатор системного процесса */
  processId: z.string().nullable().optional(),
});

/** Тип записи истории запуска бота */
export type BotLaunchHistory = typeof botLaunchHistory.$inferSelect;

/** Тип для вставки записи истории запуска бота */
export type InsertBotLaunchHistory = z.infer<typeof insertBotLaunchHistorySchema>;
