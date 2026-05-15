/**
 * @fileoverview Таблицы проекта (Bot Tables) — хранение пользовательских таблиц с колонками и строками
 * @module shared/schema/tables/bot-tables
 */

import { pgTable, serial, integer, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { z } from "zod";

import { botProjects } from "./bot-projects";

/**
 * Таблица bot_tables — пользовательские таблицы проекта
 */
export const botTables = pgTable("bot_tables", {
  /** Уникальный идентификатор таблицы */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Название таблицы */
  name: varchar("name", { length: 255 }).notNull(),
  /** Дата создания */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * Таблица bot_table_columns — колонки пользовательской таблицы
 */
export const botTableColumns = pgTable("bot_table_columns", {
  /** Уникальный идентификатор колонки */
  id: serial("id").primaryKey(),
  /** Идентификатор таблицы */
  tableId: integer("table_id").references(() => botTables.id, { onDelete: "cascade" }).notNull(),
  /** Название колонки */
  name: varchar("name", { length: 255 }).notNull(),
  /** Позиция колонки (для сортировки) */
  position: integer("position").notNull().default(0),
});

/**
 * Таблица bot_table_rows — строки пользовательской таблицы (данные в JSONB)
 */
export const botTableRows = pgTable("bot_table_rows", {
  /** Уникальный идентификатор строки */
  id: serial("id").primaryKey(),
  /** Идентификатор таблицы */
  tableId: integer("table_id").references(() => botTables.id, { onDelete: "cascade" }).notNull(),
  /** Индекс строки (для сортировки) */
  rowIndex: integer("row_index").notNull(),
  /** Данные строки в формате JSONB: { columnId: value } */
  data: jsonb("data").notNull().default({}),
});

/** Схема вставки таблицы */
export const insertBotTableSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number().int().positive(),
  /** Название таблицы */
  name: z.string().min(1).max(255),
});

/** Схема вставки колонки */
export const insertBotTableColumnSchema = z.object({
  /** Идентификатор таблицы */
  tableId: z.number().int().positive(),
  /** Название колонки */
  name: z.string().min(1).max(255),
  /** Позиция колонки */
  position: z.number().int().min(0).default(0),
});

/** Схема вставки строки */
export const insertBotTableRowSchema = z.object({
  /** Идентификатор таблицы */
  tableId: z.number().int().positive(),
  /** Индекс строки */
  rowIndex: z.number().int().min(0),
  /** Данные строки */
  data: z.record(z.string(), z.string()).default({}),
});

/** Тип записи таблицы */
export type BotTable = typeof botTables.$inferSelect;

/** Тип для вставки таблицы */
export type InsertBotTable = z.infer<typeof insertBotTableSchema>;

/** Тип записи колонки */
export type BotTableColumn = typeof botTableColumns.$inferSelect;

/** Тип для вставки колонки */
export type InsertBotTableColumn = z.infer<typeof insertBotTableColumnSchema>;

/** Тип записи строки */
export type BotTableRow = typeof botTableRows.$inferSelect;

/** Тип для вставки строки */
export type InsertBotTableRow = z.infer<typeof insertBotTableRowSchema>;
