/**
 * @fileoverview Таблица file_id медиафайлов по токенам ботов.
 * Хранит Telegram file_id отдельно для каждой пары (медиафайл, токен бота),
 * чтобы у проектов с несколькими ботами был свой идентификатор на бота.
 * @module shared/schema/tables/media-file-tokens
 */

import { pgTable, text, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { botTokens } from "./bot-tokens";
import { mediaFiles } from "./media-files";

/**
 * Таблица file_id медиафайла по токенам ботов (денормализация fileIdsByToken).
 * Уникальность пары (медиафайл, токен) гарантирует один file_id на бота.
 */
export const mediaFileTokens = pgTable("media_file_tokens", {
  /** Уникальный идентификатор записи */
  id: serial("id").primaryKey(),
  /** Идентификатор медиафайла (ссылка на media_files.id) */
  mediaFileId: integer("media_file_id").references(() => mediaFiles.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор токена бота (ссылка на bot_tokens.id) */
  tokenId: integer("token_id").references(() => botTokens.id, { onDelete: "cascade" }).notNull(),
  /** Telegram file_id медиафайла для конкретного бота */
  fileId: text("file_id").notNull(),
  /** Дата создания записи */
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  /** Уникальный индекс пары (медиафайл, токен): один file_id на бота */
  mediaTokenUnique: uniqueIndex("media_file_tokens_media_token_unique").on(table.mediaFileId, table.tokenId),
}));

/** Тип записи file_id медиафайла по токену */
export type MediaFileToken = typeof mediaFileTokens.$inferSelect;

/** Тип для вставки file_id медиафайла по токену */
export type InsertMediaFileToken = typeof mediaFileTokens.$inferInsert;
