/**
 * @fileoverview OpenAPI-схемы reveal секретного env бота.
 * @module server/swagger/schemas/bot-env-reveal
 */

import "./common";
import { z } from "zod";

/** Cookie сессии Studio */
export const BotEnvCookiesSchema = z.object({
  "connect.sid": z
    .string()
    .optional()
    .openapi({
      description: "Session cookie. Не нужна при Bearer PAT.",
      example: "s%3Axxxx.yyyy",
      param: {
        description:
          "Session cookie Studio. Не нужна при Bearer PAT. Без обоих — 401.",
        example: "s%3Axxxx.yyyy",
      },
    }),
});

/** Path :id переменной bot_env_variables */
export const BotEnvIdParamsSchema = z.object({
  id: z.string().openapi({
    example: "15",
    param: {
      description: "ID записи bot_env_variables",
      example: "15",
    },
  }),
});

/** Path проекта + токена + id переменной (UI-путь) */
export const BotEnvNestedParamsSchema = z.object({
  projectId: z.string().openapi({
    example: "42",
    param: { description: "ID проекта", example: "42" },
  }),
  tokenId: z.string().openapi({
    example: "7",
    param: { description: "ID токена бота", example: "7" },
  }),
  id: z.string().openapi({
    example: "15",
    param: { description: "ID переменной env", example: "15" },
  }),
});

/** Успешный reveal — сырое значение */
export const BotEnvRevealResponseSchema = z
  .object({
    value: z.string().openapi({
      example: "sk-live-••••",
      description: "Реальное значение переменной (секрет в открытом виде)",
    }),
  })
  .openapi("BotEnvRevealResponse");

/** Ошибка reveal */
export const BotEnvRevealErrorSchema = z
  .object({
    error: z.string().optional(),
    message: z.string().optional(),
  })
  .openapi("BotEnvRevealError");
