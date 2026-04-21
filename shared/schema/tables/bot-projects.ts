/**
 * @fileoverview Таблица проектов ботов
 * @module shared/schema/tables/bot-projects
 */

import { pgTable, text, serial, integer, jsonb, timestamp, bigint, real } from "drizzle-orm/pg-core";
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
  /** Порядок сортировки проекта в списке */
  sortOrder: real("sort_order").default(0),
  /** ID администраторов бота (через запятую) */
  adminIds: text("admin_ids").default(""),
  /** ID сессии гостевого пользователя (для изоляции гостевых проектов) */
  sessionId: text("session_id"),
});

/** Схема для вставки данных проекта бота */
export const insertBotProjectSchema = z.object({
  /** Идентификатор владельца проекта */
  ownerId: z.number().nullable().optional(),
  /** Название проекта */
  name: z.string().min(1, "Название проекта обязательно"),
  /** Описание проекта */
  description: z.string().nullable().optional(),
  /** JSON-данные проекта */
  data: z.unknown(),
  /** Токен бота */
  botToken: z.string().nullable().optional(),
  /** Флаг включения пользовательской базы данных */
  userDatabaseEnabled: z.number().min(0).max(1).default(1),
  /** ID последней экспортированной Google Таблицы пользователей */
  lastExportedGoogleSheetId: z.string().nullable().optional(),
  /** URL последней экспортированной Google Таблицы пользователей */
  lastExportedGoogleSheetUrl: z.string().nullable().optional(),
  /** Дата последнего экспорта пользователей */
  lastExportedAt: z.date().nullable().optional(),
  /** ID последней экспортированной Google Таблицы структуры проекта */
  lastExportedStructureSheetId: z.string().nullable().optional(),
  /** URL последней экспортированной Google Таблицы структуры проекта */
  lastExportedStructureSheetUrl: z.string().nullable().optional(),
  /** Дата последнего экспорта структуры проекта */
  lastExportedStructureAt: z.date().nullable().optional(),
  /** Порядок сортировки проекта */
  sortOrder: z.number().default(0).optional(),
  /** ID администраторов бота */
  adminIds: z.string().default("").optional(),
  /** ID сессии гостевого пользователя */
  sessionId: z.string().nullable().optional(),
  /** Флаг необходимости перезапуска бота при обновлении */
  restartOnUpdate: z.boolean().default(false).optional(),
});

/** Тип записи проекта бота */
export type BotProject = typeof botProjects.$inferSelect;

/** Тип для вставки проекта бота */
export type InsertBotProject = Omit<typeof botProjects.$inferInsert, "id" | "createdAt" | "updatedAt"> & {
  /** Р¤Р»Р°Рі РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё РїРµСЂРµР·Р°РїСѓСЃРєР° Р±РѕС‚Р° РїСЂРё РѕР±РЅРѕРІР»РµРЅРёРё */
  restartOnUpdate?: boolean;
};
