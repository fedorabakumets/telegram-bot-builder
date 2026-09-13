/**
 * @fileoverview OpenAPI-схемы GET /users/activity.
 * @module server/swagger/schemas/bot-users-activity
 */

import "./common";
import { z } from "zod";
import {
  BotUsersGranularityEnum,
  BOT_USERS_GRANULARITY_OPENAPI,
  BotUsersTokenQuerySchema,
} from "./bot-users-params";

/** Query GET /users/activity */
export const BotUsersActivityQuerySchema = BotUsersTokenQuerySchema.extend({
  /** Гранулярность слотов графика */
  granularity: BotUsersGranularityEnum.optional().openapi({
    example: "1d",
    description:
      `Окно и шаг: ${BOT_USERS_GRANULARITY_OPENAPI}. ` +
      "Короткие (1m/5m/1h) — из bot_messages; длинные — из user_activity_daily. " +
      "По умолчанию 1d.",
  }),
});

/** Точка активности пользователей */
export const UserActivityPointSchema = z
  .object({
    /** ISO datetime слота */
    date: z.string().openapi({ example: "2026-09-01T00:00:00.000Z" }),
    /** Уникальные активные в слоте */
    total: z.number().int().openapi({ example: 42 }),
    /** Новички слота (first_seen_at попадает в слот) */
    newcomers: z.number().int().openapi({ example: 7 }),
    /** Вернувшиеся = total − newcomers */
    returning: z.number().int().openapi({ example: 35 }),
  })
  .openapi("UserActivityPoint");

/** Ответ GET /users/activity */
export const UserActivityResponseSchema = z
  .object({
    /** Точки по слотам (пустые заполнены нулями) */
    points: z.array(UserActivityPointSchema),
    /** Уникальные активные за всё окно (не сумма точек) */
    activeInWindow: z.number().int().openapi({ example: 310 }),
    /** Новички за всё окно */
    newInWindow: z.number().int().openapi({ example: 58 }),
  })
  .openapi("UserActivityResponse");
