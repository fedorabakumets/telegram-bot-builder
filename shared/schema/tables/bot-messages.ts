/**
 * @fileoverview Таблицы истории сообщений и связи сообщений с медиа
 * @module shared/schema/tables/bot-messages
 */

import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
  /** Идентификатор проекта (ссылка на bot_projects.id) */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор пользователя в Telegram */
  userId: text("user_id").notNull(),
  /** Тип сообщения ("user" или "bot") */
  messageType: text("message_type").notNull(),
  /** Текст сообщения */
  messageText: text("message_text"),
  /** Дополнительные данные (медиа, кнопки и т.д.) */
  messageData: jsonb("message_data"),
  /** ID узла бота, который отправил сообщение */
  nodeId: text("node_id"),
  /** ID основного медиа (фото/видео) для быстрого доступа */
  primaryMediaId: integer("primary_media_id").references(() => mediaFiles.id, { onDelete: "set null" }),
  /** Дата создания сообщения */
  createdAt: timestamp("created_at", { mode: 'date', withTimezone: true }).defaultNow(),
});

/**
 * Таблица связи сообщений с медиафайлами (для множественных медиа)
 */
export const botMessageMedia = pgTable("bot_message_media", {
  /** Уникальный идентификатор связи */
  id: serial("id").primaryKey(),
  /** ID сообщения (ссылка на bot_messages.id) */
  messageId: integer("message_id").references(() => botMessagesTable.id, { onDelete: "cascade" }).notNull(),
  /** ID медиафайла (ссылка на media_files.id) */
  mediaFileId: integer("media_file_id").references(() => mediaFiles.id, { onDelete: "cascade" }).notNull(),
  /** Тип медиа ("photo", "video", "audio", "document") */
  mediaKind: text("media_kind").notNull(),
  /** Порядковый индекс для множественных медиа */
  orderIndex: integer("order_index").default(0),
  /** Дата создания связи */
  createdAt: timestamp("created_at").defaultNow(),
});

/** Схема для вставки данных сообщения бота */
export const insertBotMessageSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number(),
  /** Идентификатор пользователя в Telegram */
  userId: z.string(),
  /** Тип сообщения ("user" или "bot") */
  messageType: z.string(),
  /** Текст сообщения */
  messageText: z.string().nullable().optional(),
  /** Дополнительные данные (медиа, кнопки и т.д.) */
  messageData: z.any().nullable().optional(),
  /** ID узла бота, который отправил сообщение */
  nodeId: z.string().nullable().optional(),
  /** ID основного медиа (фото/видео) для быстрого доступа */
  primaryMediaId: z.number().nullable().optional(),
});

/** Схема для вставки данных связи сообщений с медиафайлами */
export const insertBotMessageMediaSchema = createInsertSchema(botMessageMedia).pick({
  /** ID сообщения (ссылка на bot_messages.id) */
  messageId: true,
  /** ID медиафайла (ссылка на media_files.id) */
  mediaFileId: true,
  /** Тип медиа ("photo", "video", "audio", "document") */
  mediaKind: true,
  /** Порядковый индекс для множественных медиа */
  orderIndex: true,
});

/** Тип записи сообщения бота */
export type BotMessage = typeof botMessages.$inferSelect;

/** Тип для вставки сообщения бота */
export type InsertBotMessage = z.infer<typeof insertBotMessageSchema>;

/** Тип записи связи сообщения с медиа */
export type BotMessageMedia = typeof botMessageMedia.$inferSelect;

/** Тип для вставки связи сообщения с медиа */
export type InsertBotMessageMedia = z.infer<typeof insertBotMessageMediaSchema>;
