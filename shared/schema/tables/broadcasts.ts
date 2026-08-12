/**
 * @fileoverview Таблицы рассылок и результатов отправки с Zod-схемами вставки
 * @module shared/schema/tables/broadcasts
 */

import { pgTable, text, serial, integer, jsonb, timestamp, json } from "drizzle-orm/pg-core";
import { z } from "zod";

import { botProjects } from "./bot-projects";
import { broadcastCampaigns } from "./broadcast-campaigns";
import { broadcastFiltersSchema, type BroadcastFilters } from "./broadcast-filters";

/**
 * Таблица рассылок — хранит задания на массовую отправку сообщений.
 * Рассылка может быть дочерней записью кампании («большой рассылки») — тогда заполнен campaignId
 */
export const broadcasts = pgTable("broadcasts", {
  /** Уникальный идентификатор рассылки */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Идентификатор родительской кампании (null — одиночная рассылка) */
  campaignId: integer("campaign_id").references(() => broadcastCampaigns.id, { onDelete: "cascade" }),
  /** Идентификатор токена бота */
  tokenId: integer("token_id").notNull().default(0),
  /** Название рассылки */
  name: text("name").notNull(),
  /** HTML-текст сообщения рассылки */
  messageText: text("message_text").notNull(),
  /** Фильтры аудитории в формате JSON */
  filters: jsonb("filters").notNull().default({}),
  /** Статус рассылки: pending | running | stopped | done | failed */
  status: text("status").notNull().default("pending"),
  /** Всего получателей */
  totalCount: integer("total_count").notNull().default(0),
  /** Отправлено сообщений */
  sentCount: integer("sent_count").notNull().default(0),
  /** Доставлено успешно */
  deliveredCount: integer("delivered_count").notNull().default(0),
  /** Ошибок при отправке (прочие, не блокировка и не удалённый аккаунт) */
  failedCount: integer("failed_count").notNull().default(0),
  /** Получателей, заблокировавших бота */
  blockedCount: integer("blocked_count").notNull().default(0),
  /** Получателей с удалённым/недоступным аккаунтом */
  deletedCount: integer("deleted_count").notNull().default(0),
  /** Дата создания рассылки */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  /** Дата начала отправки */
  startedAt: timestamp("started_at", { withTimezone: true }),
  /** Дата завершения отправки */
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  /** URL медиафайлов для отправки вместе с сообщением */
  mediaUrls: json("media_urls").$type<string[]>().default([]),
  /** Инлайн-кнопки сообщения рассылки */
  buttons: json("buttons").$type<any[]>().default([]),
  /** Кол-во кнопок в ряду (0 = все в один ряд) */
  buttonsPerRow: integer("buttons_per_row").default(0),
});

/**
 * Таблица результатов рассылки — по одной записи на каждого получателя
 */
export const broadcastResults = pgTable("broadcast_results", {
  /** Уникальный идентификатор результата */
  id: serial("id").primaryKey(),
  /** Идентификатор рассылки */
  broadcastId: integer("broadcast_id").references(() => broadcasts.id, { onDelete: "cascade" }).notNull(),
  /** Telegram user_id получателя */
  userId: text("user_id").notNull(),
  /** Статус отправки: sent | failed | blocked | not_found */
  status: text("status").notNull(),
  /** Описание ошибки от Telegram (если есть) */
  errorMessage: text("error_message"),
  /** ID сообщения в Telegram (для удаления/редактирования) */
  telegramMessageId: integer("telegram_message_id"),
  /** Дата отправки */
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow(),
});

export { broadcastFiltersSchema };

/** Схема вставки рассылки */
export const insertBroadcastSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number().int().positive(),
  /** Идентификатор родительской кампании (для «большой рассылки») */
  campaignId: z.number().int().positive().nullable().optional(),
  /** Идентификатор токена бота */
  tokenId: z.number().int().min(0).default(0),
  /** Название рассылки (может быть пустым до нормализации на API) */
  name: z.string().max(200),
  /** HTML-текст сообщения */
  messageText: z.string().min(1),
  /** URL медиафайлов для отправки */
  mediaUrls: z.array(z.string()).default([]),
  /** Инлайн-кнопки сообщения рассылки */
  buttons: z.array(z.any()).default([]),
  /** Кол-во кнопок в ряду (0 = все в один ряд) */
  buttonsPerRow: z.number().int().min(0).default(0),
  /** Фильтры аудитории */
  filters: broadcastFiltersSchema.default({}),
  /** Статус рассылки */
  status: z.enum(["pending", "running", "stopped", "done", "failed"]).default("pending"),
});

/** Схема вставки результата рассылки */
export const insertBroadcastResultSchema = z.object({
  /** Идентификатор рассылки */
  broadcastId: z.number().int().positive(),
  /** Telegram user_id получателя */
  userId: z.string().min(1),
  /** Статус отправки */
  status: z.enum(["sent", "failed", "blocked", "not_found"]),
  /** Описание ошибки */
  errorMessage: z.string().nullable().optional(),
  /** ID сообщения в Telegram (для удаления/редактирования) */
  telegramMessageId: z.number().int().nullable().optional(),
});

/** Тип записи рассылки */
export type Broadcast = typeof broadcasts.$inferSelect;

/** Тип для вставки рассылки */
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;

/** Тип записи результата рассылки */
export type BroadcastResult = typeof broadcastResults.$inferSelect;

/** Тип для вставки результата рассылки */
export type InsertBroadcastResult = z.infer<typeof insertBroadcastResultSchema>;

export type { BroadcastFilters };
