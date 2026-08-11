/**
 * @fileoverview OpenAPI-схемы project-broadcasts: detail, edit, stop, delete.
 * @module server/swagger/schemas/project-broadcasts-detail
 */

import "./common";
import { z } from "zod";
import { BroadcastItemSchema } from "./project-broadcasts";

/** Результат с ошибкой отправки */
export const BroadcastResultErrorSchema = z
  .object({
    id: z.number().int().openapi({ example: 901 }),
    broadcastId: z.number().int().openapi({ example: 15 }),
    userId: z.string().openapi({ example: "123456789" }),
    status: z.enum(["failed", "blocked", "not_found"]).openapi({ example: "blocked" }),
    errorMessage: z.string().nullable().optional().openapi({ example: "Forbidden: bot was blocked" }),
    telegramMessageId: z.number().int().nullable().optional(),
    sentAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BroadcastResultError");

/** Ответ GET …/broadcasts/{broadcastId} */
export const BroadcastDetailResponseSchema = z
  .object({
    broadcast: BroadcastItemSchema,
    results: z.array(BroadcastResultErrorSchema),
  })
  .openapi("BroadcastDetailResponse");

/** Тело PUT …/broadcasts/{broadcastId} */
export const EditBroadcastRequestSchema = z
  .object({
    messageText: z.string().min(1).max(4096).openapi({
      example: "Обновлённый текст рассылки",
      description: "Новый HTML-текст (лимит Telegram 4096)",
    }),
  })
  .openapi("EditBroadcastRequest");

/** Ответ PUT edit */
export const EditBroadcastResponseSchema = z
  .object({
    ok: z.literal(true).openapi({ example: true }),
    edited: z.number().int().openapi({ example: 110 }),
    failed: z.number().int().openapi({ example: 5 }),
  })
  .openapi("EditBroadcastResponse");

/** Ответ POST …/stop */
export const StopBroadcastResponseSchema = z
  .object({
    broadcast: BroadcastItemSchema,
  })
  .openapi("StopBroadcastResponse");

/** Ответ DELETE */
export const DeleteBroadcastResponseSchema = z
  .object({
    ok: z.literal(true).openapi({ example: true }),
    deleted: z.number().int().openapi({
      example: 115,
      description: "Сколько сообщений пытались удалить в Telegram",
    }),
  })
  .openapi("DeleteBroadcastResponse");
