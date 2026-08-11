/**
 * @fileoverview OpenAPI-схемы growth и growth-by-source.
 * @module server/swagger/schemas/bot-users-growth
 */

import "./common";
import { z } from "zod";
import {
  BotUsersGranularityEnum,
  BotUsersTokenQuerySchema,
} from "./bot-users-params";

/** Query GET /users/growth */
export const BotUsersGrowthQuerySchema = BotUsersTokenQuerySchema.extend({
  /**
   * Гранулярность (предпочтительно). При наличии — series generate_series.
   * Без неё — legacy period.
   */
  granularity: BotUsersGranularityEnum.optional().openapi({
    example: "1d",
    description: "1m|5m|1h|1d|7d|30d",
  }),
  /** Legacy-период, если нет granularity: 7d|30d|90d (default 30d) */
  period: z.enum(["7d", "30d", "90d"]).optional().openapi({
    example: "30d",
    description: "Обратная совместимость; игнорируется при granularity",
  }),
});

/** Точка прироста пользователей */
export const GrowthPointSchema = z
  .object({
    /** ISO datetime (granularity) или YYYY-MM-DD (period) */
    date: z.string().openapi({ example: "2026-08-01T00:00:00.000Z" }),
    /** Новые пользователи в слоте */
    count: z.number().int().openapi({ example: 5 }),
  })
  .openapi("GrowthPoint");

/** Ответ GET /users/growth */
export const GrowthPointListSchema = z
  .array(GrowthPointSchema)
  .openapi("GrowthPointList");

/** Query GET /users/growth-by-source (granularity обязателен) */
export const BotUsersGrowthBySourceQuerySchema = BotUsersTokenQuerySchema.extend({
  /** Гранулярность — обязательна (иначе 400) */
  granularity: BotUsersGranularityEnum.openapi({
    example: "1d",
    description: "Обязательный: 1m|5m|1h|1d|7d|30d",
  }),
});

/** Точка прироста с разбивкой по deep_link_param */
export const GrowthBySourcePointSchema = z
  .object({
    /** ISO datetime слота */
    date: z.string().openapi({ example: "2026-08-01T00:00:00.000Z" }),
    /** Ключ — источник (direct / utm), значение — count */
    sources: z
      .record(z.string(), z.number())
      .openapi({ example: { direct: 3, instagram: 2 } }),
  })
  .openapi("GrowthBySourcePoint");

/** Ответ GET /users/growth-by-source */
export const GrowthBySourceListSchema = z
  .array(GrowthBySourcePointSchema)
  .openapi("GrowthBySourceList");
