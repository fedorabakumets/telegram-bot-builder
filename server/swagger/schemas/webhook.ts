/**
 * @fileoverview OpenAPI-схемы входящего Telegram webhook
 * @module server/swagger/schemas/webhook
 */

import "./common";
import { z } from "zod";

/**
 * Фрагмент Telegram Update (полная схема — Bot API Update).
 * Дополнительные поля разрешены (callback_query, edited_message и т.д.).
 */
export const TelegramWebhookUpdateSchema = z
  .object({
    /** Уникальный идентификатор апдейта */
    update_id: z.number().int().openapi({ example: 10000 }),
    /** Текстовое сообщение */
    message: z
      .object({
        message_id: z.number().int().openapi({ example: 1365 }),
        date: z.number().int().openapi({ example: 1441645532 }),
        chat: z
          .object({
            id: z.number().int().openapi({ example: 783828 }),
            type: z.string().openapi({ example: "private" }),
            first_name: z.string().optional().openapi({ example: "User" }),
          })
          .passthrough(),
        text: z.string().optional().openapi({ example: "Привет" }),
      })
      .passthrough()
      .optional(),
    /** Inline callback */
    callback_query: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()
  .openapi("TelegramWebhookUpdate");

/** Ошибка 400 — невалидные path-параметры */
export const WebhookBadParamsSchema = z
  .object({
    /** Текст ошибки */
    message: z.string().openapi({ example: "Некорректные projectId или tokenId" }),
  })
  .openapi("WebhookBadParams");

/** Успешный ответ webhook — пустое body (res.end() без данных) */
export const WebhookEmptyBodySchema = z
  .string()
  .openapi({
    description: "Пустое body. Node не возвращает JSON — только HTTP-статус.",
    example: "",
  })
  .openapi("WebhookEmptyBody");
