/**
 * @fileoverview OpenAPI-схемы `/api/bot/*` (bot-manager API).
 * @module server/swagger/schemas/bot-api
 */

import "./common";
import { z } from "zod";

/** Cookie / описание Bearer для bot API */
export const BotApiCookiesSchema = z.object({
  "connect.sid": z
    .string()
    .optional()
    .openapi({
      description: "Session Studio. Альтернатива — Bearer PAT.",
      example: "s%3Axxxx.yyyy",
      param: {
        description:
          "Session cookie. Для bot-manager предпочтителен Bearer PAT со scope bot_manager.",
        example: "s%3Axxxx.yyyy",
      },
    }),
});

/** Query telegram_id */
export const BotApiTelegramIdQuerySchema = z.object({
  telegram_id: z.string().openapi({
    example: "123456789",
    param: {
      description:
        "Telegram user id актора. Обязателен при PAT scope bot_manager. " +
        "При личной сессии/PAT должен совпадать с req.user.id (или можно опустить).",
      example: "123456789",
    },
  }),
});

/** Ошибка bot API */
export const BotApiErrorSchema = z
  .object({
    error: z.string().optional(),
    message: z.string().optional(),
  })
  .openapi("BotApiError");

/** Список проектов (safe DTO) */
export const BotApiProjectListSchema = z
  .object({
    items: z.array(
      z.object({
        id: z.number().int(),
        name: z.string(),
        description: z.string().nullable().optional(),
        createdAt: z.union([z.string(), z.date()]).nullable().optional(),
        updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
        sortOrder: z.number().nullable().optional(),
      }),
    ),
    count: z.number().int(),
  })
  .openapi("BotApiProjectList");
