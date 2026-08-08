/**
 * @fileoverview OpenAPI-схемы GET /api/bot-logs/{logId}.
 * @module server/swagger/schemas/bot-logs
 */

import "./common";
import { z } from "zod";

/** Запись bot_logs (одна строка терминала) */
export const BotLogDtoSchema = z
  .object({
    /** ID записи bot_logs */
    id: z.number().int().openapi({ example: 42 }),
    /** ID проекта */
    projectId: z.number().int().openapi({ example: 266 }),
    /** ID токена бота */
    tokenId: z.number().int().openapi({ example: 7 }),
    /** ID запуска (null — вне launch history) */
    launchId: z.number().int().nullable().optional().openapi({ example: 15 }),
    /** Текст строки */
    content: z.string().openapi({ example: "Bot started successfully" }),
    /** Тип: stdout | stderr | status */
    type: z.string().openapi({ example: "stdout" }),
    /** Время записи */
    timestamp: z.union([z.string(), z.date()]).nullable().optional().openapi({
      example: "2026-08-08T20:00:00.000Z",
    }),
  })
  .openapi("BotLog");

/** Path-параметр logId */
export const BotLogIdParamsSchema = z.object({
  logId: z.string().openapi({
    example: "42",
    description: "ID записи в таблице bot_logs",
    param: {
      description: "ID записи в таблице bot_logs (из permalink ?log=)",
      example: "42",
    },
  }),
});

/**
 * Session cookie для /api/bot-logs/* (или Bearer PAT).
 * Без обоих глобальный requireApiAuth → 401.
 */
export const BotLogsCookiesSchema = z.object({
  "connect.sid": z
    .string()
    .optional()
    .openapi({
      description:
        "Session cookie Studio. Не нужна при Bearer PAT (Authorize). Без обоих — 401.",
      example: "s%3Axxxx.yyyy",
      param: {
        description:
          "Session cookie Studio. Не нужна при Bearer PAT. Без cookie и без PAT — 401.",
        example: "s%3Axxxx.yyyy",
      },
    }),
});

/** Ошибка bot-logs API */
export const BotLogErrorSchema = z
  .object({
    error: z.string().openapi({ example: "Запись лога не найдена" }),
  })
  .openapi("BotLogError");
