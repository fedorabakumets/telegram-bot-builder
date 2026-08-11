/**
 * @fileoverview OpenAPI-схемы stats / traffic / popular-buttons (project-users).
 * @module server/swagger/schemas/bot-users-analytics
 */

import "./common";
import { z } from "zod";
import {
  BotUsersGranularityEnum,
  BotUsersTokenQuerySchema,
} from "./bot-users-params";

/** Агрегаты GET /users/stats (после parseInt на сервере) */
export const BotUserStatsSchema = z
  .object({
    /** Всего пользователей */
    totalUsers: z.number().openapi({ example: 150 }),
    /** is_active = 1 */
    activeUsers: z.number().openapi({ example: 120 }),
    /** is_active = 0 */
    blockedUsers: z.number().openapi({ example: 30 }),
    /** is_premium = 1 */
    premiumUsers: z.number().openapi({ example: 12 }),
    /** Непустой user_data */
    usersWithResponses: z.number().openapi({ example: 45 }),
    /** COUNT(*) из bot_messages */
    totalInteractions: z.number().openapi({ example: 3200 }),
    /** totalInteractions / totalUsers (или 0) */
    avgInteractionsPerUser: z.number().openapi({ example: 21 }),
    /** Уникальные language_code */
    uniqueLanguages: z.number().openapi({ example: 5 }),
    /** deep_link_param не null и не 'direct' */
    deepLinkUsers: z.number().openapi({ example: 40 }),
    /** referrer_id не null */
    referralUsers: z.number().openapi({ example: 18 }),
  })
  .openapi("BotUserStats");

/** Источник трафика (deep_link_param / direct) */
export const TrafficSourceSchema = z
  .object({
    /** Параметр источника */
    param: z.string().openapi({ example: "instagram" }),
    /** Число пользователей */
    count: z.union([z.number(), z.string()]).openapi({ example: 40 }),
    /** Доля в % (часто строка из SQL) */
    percentage: z.union([z.number(), z.string()]).openapi({ example: 26.7 }),
  })
  .openapi("TrafficSource");

/** Язык пользователей (топ-20) */
export const TrafficLanguageSchema = z
  .object({
    /** Код языка */
    code: z.string().openapi({ example: "ru" }),
    /** Число пользователей */
    count: z.union([z.number(), z.string()]).openapi({ example: 100 }),
    /** Доля в % */
    percentage: z.union([z.number(), z.string()]).openapi({ example: 66.7 }),
  })
  .openapi("TrafficLanguage");

/** Ответ GET /users/traffic */
export const TrafficDataSchema = z
  .object({
    /** Источники по deep_link_param */
    sources: z.array(TrafficSourceSchema),
    /** Языки (language_code IS NOT NULL, LIMIT 20) */
    languages: z.array(TrafficLanguageSchema),
  })
  .openapi("TrafficData");

/** Query GET /users/popular-buttons */
export const PopularButtonsQuerySchema = BotUsersTokenQuerySchema.extend({
  /** Окно времени; default на сервере — 1d → 30 days */
  granularity: BotUsersGranularityEnum.optional().openapi({
    example: "1d",
    description: "1m|5m|1h|1d|7d|30d; без параметра — как 1d",
  }),
});

/** Элемент топ-10 кнопок */
export const PopularButtonItemSchema = z
  .object({
    /** button_text или callback_data */
    label: z.string().openapi({ example: "Купить" }),
    /** Число нажатий */
    count: z.number().int().openapi({ example: 42 }),
  })
  .openapi("PopularButtonItem");

/** Ответ GET /users/popular-buttons */
export const PopularButtonsListSchema = z
  .array(PopularButtonItemSchema)
  .openapi("PopularButtonsList");
