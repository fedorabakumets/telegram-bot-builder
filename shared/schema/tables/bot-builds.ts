/**
 * @fileoverview Таблица сборок ботов — указатели на сгенерированный код в хранилище
 * @module shared/schema/tables/bot-builds
 */

import { pgTable, serial, integer, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { botProjects } from "./bot-projects";
import { botTokens } from "./bot-tokens";

/**
 * Сборка бота: сжатый сгенерированный `.py` лежит в хранилище (local/S3),
 * здесь — только метаданные. Одна сборка на пару (токен, отпечаток).
 */
export const botBuilds = pgTable("bot_builds", {
  /** Уникальный идентификатор сборки */
  id: serial("id").primaryKey(),
  /** Проект, для которого собран код */
  projectId: integer("project_id").notNull().references(() => botProjects.id, { onDelete: "cascade" }),
  /** Токен бота, для которого собран код */
  tokenId: integer("token_id").notNull().references(() => botTokens.id, { onDelete: "cascade" }),
  /** Отпечаток входных данных генерации (sha256 hex) */
  fingerprint: text("fingerprint").notNull(),
  /** ID хранилища (storage_configs.id или служебный локальный) */
  storageConfigId: text("storage_config_id").notNull(),
  /** Ключ объекта в хранилище */
  objectKey: text("object_key").notNull(),
  /** Имя основного файла бота (например, bot.py) */
  fileName: text("file_name").notNull(),
  /** Размер несжатого кода в байтах */
  size: integer("size").notNull(),
  /** sha256 несжатого кода (hex) — проверка целостности при загрузке */
  sha256: text("sha256").notNull(),
  /** Версия генератора на момент сборки */
  generatorVersion: text("generator_version").notNull(),
  /** Дата создания сборки */
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  /** Одна сборка на пару токен + отпечаток */
  tokenFingerprintIdx: uniqueIndex("uq_bot_builds_token_fingerprint").on(table.tokenId, table.fingerprint),
  /** Быстрый поиск последних сборок токена */
  tokenCreatedIdx: index("idx_bot_builds_token_created").on(table.tokenId, table.createdAt),
}));

/** Тип записи сборки бота */
export type BotBuild = typeof botBuilds.$inferSelect;

/** Тип для вставки сборки бота */
export type InsertBotBuild = typeof botBuilds.$inferInsert;
