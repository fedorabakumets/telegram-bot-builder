/**
 * @fileoverview Таблицы чата поддержки платформы: диалоги и сообщения
 * @module shared/schema/tables/support-chat
 */

import { pgTable, text, serial, timestamp, bigint, integer, jsonb, index } from "drizzle-orm/pg-core";

import { telegramUsers } from "./telegram-users";

/**
 * Диалог поддержки: ровно один на пользователя платформы
 */
export const supportThreads = pgTable("support_threads", {
  /** Уникальный идентификатор диалога */
  id: serial("id").primaryKey(),
  /** Пользователь платформы (ссылка на telegram_users.id), уникален */
  userId: bigint("user_id", { mode: "number" })
    .references(() => telegramUsers.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  /** Статус диалога: "open" или "closed" */
  status: text("status").default("open").notNull(),
  /** Количество сообщений пользователя, не прочитанных администратором */
  unreadByAdmin: integer("unread_by_admin").default(0).notNull(),
  /** Количество ответов администратора, не прочитанных пользователем */
  unreadByUser: integer("unread_by_user").default(0).notNull(),
  /** Идентификатор темы в Telegram-группе поддержки (мост в Telegram) */
  telegramTopicId: integer("telegram_topic_id"),
  /** Время последнего сообщения — для сортировки списка */
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  /** Дата создания диалога */
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  /** Индекс для сортировки списка диалогов в админке */
  lastMessageIdx: index("support_threads_last_message_idx").on(table.lastMessageAt),
}));

/**
 * Сообщение в диалоге поддержки
 */
export const supportMessages = pgTable("support_messages", {
  /** Уникальный идентификатор сообщения */
  id: serial("id").primaryKey(),
  /** Диалог (ссылка на support_threads.id) */
  threadId: integer("thread_id")
    .references(() => supportThreads.id, { onDelete: "cascade" })
    .notNull(),
  /** Отправитель: "user" или "admin" */
  sender: text("sender").notNull(),
  /** Текст сообщения */
  text: text("text").notNull(),
  /** Контекст отправки: проект, страница, браузер */
  context: jsonb("context"),
  /** Откуда пришло сообщение: "web" или "telegram" */
  source: text("source").default("web").notNull(),
  /** Дата создания сообщения */
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  /** Индекс для выборки сообщений диалога по порядку */
  threadIdx: index("support_messages_thread_idx").on(table.threadId, table.id),
}));

/**
 * Картинка, приложенная к сообщению поддержки.
 * Файл лежит в активном хранилище, не в media_files проекта.
 */
export const supportAttachments = pgTable("support_attachments", {
  /** Уникальный идентификатор вложения */
  id: serial("id").primaryKey(),
  /** Сообщение (ссылка на support_messages.id), удаляется вместе с ним */
  messageId: integer("message_id")
    .references(() => supportMessages.id, { onDelete: "cascade" })
    .notNull(),
  /** Исходное имя файла */
  fileName: text("file_name").notNull(),
  /** MIME, определённый по содержимому: png, jpeg, webp или gif */
  mime: text("mime").notNull(),
  /** Размер в байтах */
  size: integer("size").notNull(),
  /** Идентификатор хранилища из storage_configs */
  storageConfigId: text("storage_config_id").notNull(),
  /** Ключ объекта в хранилище */
  storageKey: text("storage_key").notNull(),
  /** Дата загрузки */
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  /** Индекс для выборки вложений сообщения */
  messageIdx: index("support_attachments_message_idx").on(table.messageId),
}));

/** Тип записи диалога поддержки */
export type SupportThread = typeof supportThreads.$inferSelect;

/** Тип записи сообщения поддержки */
export type SupportMessage = typeof supportMessages.$inferSelect;

/** Тип для вставки сообщения поддержки */
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

/** Тип записи вложения поддержки */
export type SupportAttachment = typeof supportAttachments.$inferSelect;
