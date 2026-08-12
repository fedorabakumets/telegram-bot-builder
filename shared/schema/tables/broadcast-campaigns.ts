/**
 * @fileoverview Таблица кампаний рассылок («Большая рассылка») — родительская сущность
 * для параллельных дочерних рассылок по нескольким ботам проекта
 * @module shared/schema/tables/broadcast-campaigns
 */

import { pgTable, text, serial, integer, jsonb, timestamp, json } from "drizzle-orm/pg-core";
import { z } from "zod";

import { botProjects } from "./bot-projects";
import { broadcastFiltersSchema } from "./broadcast-filters";

/**
 * Таблица кампаний рассылок — одна запись на «большую рассылку»,
 * дочерние записи хранятся в broadcasts с ссылкой campaign_id
 */
export const broadcastCampaigns = pgTable("broadcast_campaigns", {
  /** Уникальный идентификатор кампании */
  id: serial("id").primaryKey(),
  /** Идентификатор проекта-владельца кампании */
  projectId: integer("project_id").references(() => botProjects.id, { onDelete: "cascade" }).notNull(),
  /** Название кампании */
  name: text("name").notNull(),
  /** HTML-текст сообщения, общий для всех дочерних рассылок */
  messageText: text("message_text").notNull(),
  /** URL медиафайлов для отправки вместе с сообщением */
  mediaUrls: json("media_urls").$type<string[]>().default([]),
  /** Инлайн-кнопки сообщения кампании */
  buttons: json("buttons").$type<any[]>().default([]),
  /** Кол-во кнопок в ряду (0 = все в один ряд) */
  buttonsPerRow: integer("buttons_per_row").default(0),
  /** Фильтры аудитории в формате JSON (общие для всех ботов) */
  filters: jsonb("filters").notNull().default({}),
  /** Идентификаторы выбранных токенов ботов кампании */
  tokenIds: jsonb("token_ids").$type<number[]>().notNull().default([]),
  /** Статус кампании: pending | running | stopped | done | failed | partial */
  status: text("status").notNull().default("pending"),
  /** Всего получателей по всем ботам */
  totalCount: integer("total_count").notNull().default(0),
  /** Обработано сообщений по всем ботам */
  sentCount: integer("sent_count").notNull().default(0),
  /** Доставлено успешно по всем ботам */
  deliveredCount: integer("delivered_count").notNull().default(0),
  /** Ошибок при отправке по всем ботам (прочие) */
  failedCount: integer("failed_count").notNull().default(0),
  /** Заблокировали бота по всем дочерним рассылкам */
  blockedCount: integer("blocked_count").notNull().default(0),
  /** Аккаунт удалён / недоступен по всем дочерним рассылкам */
  deletedCount: integer("deleted_count").notNull().default(0),
  /** Дата создания кампании */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  /** Дата начала отправки */
  startedAt: timestamp("started_at", { withTimezone: true }),
  /** Дата завершения отправки */
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

/** Допустимые статусы кампании рассылки */
export const broadcastCampaignStatusSchema = z.enum([
  "pending",
  "running",
  "stopped",
  "done",
  "failed",
  "partial",
]);

/** Схема вставки кампании рассылки */
export const insertBroadcastCampaignSchema = z.object({
  /** Идентификатор проекта */
  projectId: z.number().int().positive(),
  /** Название кампании */
  name: z.string().max(200),
  /** HTML-текст сообщения */
  messageText: z.string().min(1),
  /** URL медиафайлов для отправки */
  mediaUrls: z.array(z.string()).default([]),
  /** Инлайн-кнопки сообщения */
  buttons: z.array(z.any()).default([]),
  /** Кол-во кнопок в ряду (0 = все в один ряд) */
  buttonsPerRow: z.number().int().min(0).default(0),
  /** Фильтры аудитории */
  filters: broadcastFiltersSchema.default({}),
  /** Идентификаторы выбранных токенов ботов */
  tokenIds: z.array(z.number().int().positive()).min(1),
  /** Статус кампании */
  status: broadcastCampaignStatusSchema.default("pending"),
});

/** Тип записи кампании рассылки */
export type BroadcastCampaign = typeof broadcastCampaigns.$inferSelect;

/** Тип для вставки кампании рассылки */
export type InsertBroadcastCampaign = z.infer<typeof insertBroadcastCampaignSchema>;

/** Тип статуса кампании рассылки */
export type BroadcastCampaignStatus = z.infer<typeof broadcastCampaignStatusSchema>;
