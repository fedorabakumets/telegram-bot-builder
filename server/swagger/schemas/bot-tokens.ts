/**
 * @fileoverview OpenAPI-схемы настройки срока хранения сообщений токена
 * @module server/swagger/schemas/bot-tokens
 */

import "./common";
import { z } from "zod";

/** Тело PUT messages-retention */
export const UpdateMessagesRetentionRequestSchema = z
  .object({
    /**
     * Срок хранения сообщений в bot_messages (дни).
     * 0 — без автоочистки; иначе сервер удаляет сообщения токена старше N дней.
     * Длинный график аналитики (message_activity_daily) не обнуляется.
     */
    messagesRetentionDays: z
      .union([
        z.literal(0),
        z.literal(7),
        z.literal(30),
        z.literal(60),
        z.literal(90),
        z.literal(180),
        z.literal(365),
      ])
      .openapi({
        example: 60,
        description:
          "0 = безлимит; иначе 7/30/60/90/180/365. Чистится только bot_messages, не аналитика.",
      }),
  })
  .openapi("UpdateMessagesRetentionRequest");

/** Успешный ответ PUT messages-retention */
export const UpdateMessagesRetentionResponseSchema = z
  .object({
    /** Флаг успеха */
    success: z.literal(true).openapi({ example: true }),
    /** Сохранённый срок в днях */
    messagesRetentionDays: z.number().int().openapi({ example: 60 }),
  })
  .openapi("UpdateMessagesRetentionResponse");
