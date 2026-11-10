/**
 * @fileoverview Таблица запущенных экземпляров ботов
 * @module shared/schema/tables/bot-instances
 */

import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
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
  /** Желаемое состояние; null сохраняет поведение старых записей */
  desiredStatus: text("desired_status"),
  /** Версия намерения для защиты от устаревших команд */
  desiredGeneration: integer("desired_generation").notNull().default(0),
  /** Время последнего изменения намерения */
  desiredUpdatedAt: timestamp("desired_updated_at"),
  /** Поколение, для которого учтён повтор загрузки сборки */
  buildRetryGeneration: integer("build_retry_generation").notNull().default(0),
  /** Число повторов загрузки сборки в этом поколении */
  buildRetryCount: integer("build_retry_count").notNull().default(0),
  /** Время следующей попытки загрузки сборки */
  buildRetryAfter: timestamp("build_retry_after"),
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
export const insertBotInstanceSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number().int(),
  /** Идентификатор токена */
  tokenId: z.number().int(),
  /** Статус экземпляра */
  status: z.enum(["running", "stopped", "error"]),
  /** Желаемое состояние */
  desiredStatus: z.enum(["running", "stopped"]).nullable().optional(),
  /** Версия намерения */
  desiredGeneration: z.number().int().nonnegative().optional(),
  /** Время изменения намерения */
  desiredUpdatedAt: z.date().nullable().optional(),
  /** Поколение счётчика повторов сборки */
  buildRetryGeneration: z.number().int().nonnegative().optional(),
  /** Число повторов загрузки сборки */
  buildRetryCount: z.number().int().nonnegative().optional(),
  /** Время следующей попытки */
  buildRetryAfter: z.date().nullable().optional(),
  /** Токен бота */
  token: z.string().min(1, "Токен бота обязателен"),
  /** Идентификатор процесса */
  processId: z.string().nullable().optional(),
  /** Сообщение об ошибке */
  errorMessage: z.string().nullable().optional(),
  /** Время запуска экземпляра */
  startedAt: z.date().optional(),
  /** Время остановки экземпляра */
  stoppedAt: z.date().nullable().optional(),
});

/** Тип записи экземпляра бота */
export type BotInstance = typeof botInstances.$inferSelect;

/** Тип для вставки экземпляра бота */
export type InsertBotInstance = typeof botInstances.$inferInsert;
