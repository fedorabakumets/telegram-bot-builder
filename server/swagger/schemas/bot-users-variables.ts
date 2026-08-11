/**
 * @fileoverview OpenAPI-схемы GET /users/variables и DELETE /users (wipe).
 * @module server/swagger/schemas/bot-users-variables
 */

import "./common";
import { z } from "zod";
import { BotUsersTokenQuerySchema } from "./bot-users-params";

/** Query GET /users/variables */
export const BotUsersVariablesQuerySchema = BotUsersTokenQuerySchema.extend({
  /** Лимит строк (default 200) */
  limit: z.string().optional().openapi({
    example: "200",
    description: "Максимум пользователей с непустым user_data",
  }),
});

/** Ответ GET /users/variables — колонки + строки */
export const BotUsersVariablesResponseSchema = z
  .object({
    /** user_id, username + ключи user_data (без _/waiting_/input_) */
    columns: z.array(z.string()).openapi({
      example: ["user_id", "username", "city", "age"],
    }),
    /** Строки: все значения — строки */
    rows: z
      .array(z.record(z.string(), z.string()))
      .openapi({
        example: [
          { user_id: "123", username: "ivan", city: "Москва", age: "25" },
        ],
      }),
  })
  .openapi("BotUsersVariablesResponse");

/** Успех DELETE /api/projects/{id}/users (wipe) */
export const WipeAllBotUsersSuccessSchema = z
  .object({
    /** Текст об успехе */
    message: z.string().openapi({
      example: "All user data deleted successfully",
    }),
    /** Флаг удаления */
    deleted: z.literal(true).openapi({ example: true }),
    /** Сумма удалённых строк bot_users + bot_messages */
    deletedCount: z.number().int().openapi({ example: 250 }),
  })
  .openapi("WipeAllBotUsersSuccess");
