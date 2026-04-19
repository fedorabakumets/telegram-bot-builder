/**
 * @fileoverview Таблицы истории сообщений бота и схема вставки связей с медиа
 * @module shared/schema/tables/bot-messages
 */

import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

import { botProjects } from "./bot-projects";
import { mediaFiles } from "./media-files";
import { botMessages as botMessagesTable } from "./bot-messages";

/**
 * Таблица истории сообщений между ботом и пользователями
 */
export const botMessages = pgTable("bot_messages", {
  /** Уникальный идентификатор сообщения */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор токена бота для сегментации истории */
  tokenId: integer("token_id").notNull().default(0),
  /** Идентификатор пользователя в Telegram */
  userId: text("user_id").notNull(),
  /** Тип сообщения */
  messageType: text("message_type").notNull(),
  /** Текст сообщения */
  messageText: text("message_text"),
  /** Дополнительные данные сообщения */
  messageData: jsonb("message_data"),
  /** ID узла, отправившего сообщение */
  nodeId: text("node_id"),
  /** ID основного медиа */
  primaryMediaId: integer("primary_media_id").references(() => mediaFiles.id, { onDelete: "set null" }),
  /** Дата создания сообщения */
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).defaultNow(),
});

/**
 * Таблица связи сообщений с медиафайлами
 */
export const botMessageMedia = pgTable("bot_message_media", {
  /** Уникальный идентификатор связи */
  id: serial("id").primaryKey(),
  /** ID сообщения */
  messageId: integer("message_id").references(() => botMessagesTable.id, { onDelete: "cascade" }).notNull(),
  /** ID медиафайла */
  mediaFileId: integer("media_file_id").references(() => mediaFiles.id, { onDelete: "cascade" }).notNull(),
  /** Тип медиа */
  mediaKind: text("media_kind").notNull(),
  /** Порядковый индекс медиа */
  orderIndex: integer("order_index").default(0),
  /** Дата создания связи */
  createdAt: timestamp("created_at").defaultNow(),
});

/** Схема вставки сообщения бота */
export const insertBotMessageSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number(),
  /** Идентификатор токена бота */
  tokenId: z.number().int().min(0).default(0),
  /** Идентификатор пользователя в Telegram */
  userId: z.string(),
  /** Тип сообщения */
  messageType: z.string(),
  /** Текст сообщения */
  messageText: z.string().nullable().optional(),
  /** Дополнительные данные сообщения */
  messageData: z.any().nullable().optional(),
  /** ID узла бота */
  nodeId: z.string().nullable().optional(),
  /** ID основного медиа */
  primaryMediaId: z.number().nullable().optional(),
});

/** Схема вставки связи сообщения с медиа */
export const insertBotMessageMediaSchema = z.object({
  /** ID сообщения */
  messageId: z.number().int().positive(),
  /** ID медиафайла */
  mediaFileId: z.number().int().positive(),
  /** Тип медиа */
  mediaKind: z.string().min(1),
  /** Порядковый индекс медиа */
  orderIndex: z.number().int().min(0).default(0),
});

/** Тип записи сообщения бота */
export type BotMessage = typeof botMessages.$inferSelect;

/** Тип для вставки сообщения бота */
export type InsertBotMessage = z.infer<typeof insertBotMessageSchema>;

/** Тип записи связи сообщения с медиа */
export type BotMessageMedia = typeof botMessageMedia.$inferSelect;

/** Тип для вставки связи сообщения с медиа */
export type InsertBotMessageMedia = z.infer<typeof insertBotMessageMediaSchema>;
