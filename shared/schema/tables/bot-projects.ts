/**
 * @fileoverview Таблица проектов ботов
 * @module shared/schema/tables/bot-projects
 */

import { pgTable, text, serial, integer, jsonb, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { telegramUsers } from "./telegram-users";

/**
 * Таблица проектов ботов
 */
export const botProjects = pgTable("bot_projects", {
  /** Уникальный идентификатор проекта */
  id: serial("id").primaryKey(),
  /** Идентификатор владельца проекта (ссылка на telegram_users.id) */
  ownerId: bigint("owner_id", { mode: "number" }).references(() => telegramUsers.id, { onDelete: "cascade" }),
  /** Название проекта */
  name: text("name").notNull(),
  /** Описание проекта */
  description: text("description"),
  /** JSON-данные проекта (структура узлов, соединений и т.д.) */
  data: jsonb("data").notNull(),
  /** Токен бота (сохраняется в зашифрованном виде) */
  botToken: text("bot_token"),
  /** Флаг включения пользовательской базы данных (0 = выключена, 1 = включена) */
  userDatabaseEnabled: integer("user_database_enabled").default(1),
  /** ID последней экспортированной Google Таблицы пользователей */
  lastExportedGoogleSheetId: text("last_exported_google_sheet_id"),
  /** URL последней экспортированной Google Таблицы пользователей */
  lastExportedGoogleSheetUrl: text("last_exported_google_sheet_url"),
  /** Дата последнего экспорта пользователей в Google Таблицы */
  lastExportedAt: timestamp("last_exported_at"),
  /** ID последней экспортированной Google Таблицы структуры проекта */
  lastExportedStructureSheetId: text("last_exported_structure_sheet_id"),
  /** URL последней экспортированной Google Таблицы структуры проекта */
  lastExportedStructureSheetUrl: text("last_exported_structure_sheet_url"),
  /** Дата последнего экспорта структуры проекта в Google Таблицы */
  lastExportedStructureAt: timestamp("last_exported_structure_at"),
  /** Дата создания проекта */
  createdAt: timestamp("created_at").defaultNow(),
  /** Дата последнего обновления проекта */
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** Схема для вставки данных проекта бота */
export const insertBotProjectSchema = createInsertSchema(botProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  /** Флаг необходимости перезапуска бота при обновлении */
  restartOnUpdate: z.boolean().default(false).optional(),
});

/** Тип записи проекта бота */
export type BotProject = typeof botProjects.$inferSelect;

/** Тип для вставки проекта бота */
export type InsertBotProject = z.infer<typeof insertBotProjectSchema>;
