/**
 * @fileoverview OpenAPI-схемы списка инстансов ботов (без секрета token).
 * @module server/swagger/schemas/bots
 */

import "./common";
import { z } from "zod";

/** Публичный DTO инстанса — поле token никогда не отдаётся */
export const BotInstancePublicSchema = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    projectId: z.number().int().openapi({ example: 266 }),
    tokenId: z.number().int().openapi({ example: 7 }),
    status: z.string().openapi({ example: "running" }),
    processId: z.string().nullable().optional().openapi({ example: "12345" }),
    startedAt: z.union([z.string(), z.date()]).nullable().optional(),
    stoppedAt: z.union([z.string(), z.date()]).nullable().optional(),
    errorMessage: z.string().nullable().optional(),
  })
  .openapi("BotInstancePublic");

/** Ответ GET /api/bots */
export const BotInstanceListSchema = z
  .array(BotInstancePublicSchema)
  .openapi("BotInstanceList");

/** Cookie для /api/bots */
export const BotsCookiesSchema = z.object({
  "connect.sid": z
    .string()
    .optional()
    .openapi({
      description:
        "Session cookie. Без cookie/PAT → []. Не нужна при Bearer PAT.",
      example: "s%3Axxxx.yyyy",
      param: {
        description:
          "Session cookie Studio. Без личности ответ — пустой массив. Альтернатива — Bearer PAT.",
        example: "s%3Axxxx.yyyy",
      },
    }),
});
