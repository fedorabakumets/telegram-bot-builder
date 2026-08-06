/**
 * @fileoverview OpenAPI-схемы настроек токена и события token-updated
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

/**
 * Безопасный снимок токена в WS token-updated (без секретов).
 * Не содержит token, webhookSecretToken, userbotApiHash, userbotSessionString.
 */
export const TokenUpdatedPayloadSchema = z
  .object({
    id: z.number().int(),
    projectId: z.number().int(),
    name: z.string(),
    botUsername: z.string().nullable(),
    botFirstName: z.string().nullable(),
    isDefault: z.number().nullable(),
    isActive: z.number().nullable(),
    messagesRetentionDays: z.number().int(),
    autoRestart: z.number().nullable(),
    maxRestartAttempts: z.number().nullable(),
    logLevel: z.string().nullable(),
    protectContent: z.number().nullable(),
    saveIncomingMedia: z.number().nullable(),
    catchAllHandlers: z.number().nullable(),
    contentCache: z.number().nullable(),
    launchMode: z.string().nullable(),
    webhookBaseUrl: z.string().nullable(),
    userbotEnabled: z.number().nullable(),
  })
  .openapi("TokenUpdatedPayload");

/** data события ProjectEvent type=token-updated */
export const TokenUpdatedEventDataSchema = z
  .object({
    changedFields: z.array(z.string()).openapi({
      example: ["messagesRetentionDays"],
    }),
    token: TokenUpdatedPayloadSchema,
    source: z.enum(["ui", "mcp", "api"]).optional(),
  })
  .openapi("TokenUpdatedEventData");

/** Публичный экземпляр бота в ответе bot-status (без поля token) */
export const PublicBotInstanceSchema = z
  .object({
    /** ID экземпляра */
    id: z.number().int(),
    /** ID проекта */
    projectId: z.number().int(),
    /** ID токена */
    tokenId: z.number().int(),
    /** Статус: running | stopped | error */
    status: z.enum(["running", "stopped", "error"]),
    /** PID или worker_<projectId> */
    processId: z.string().nullable().optional(),
    /** Время запуска */
    startedAt: z.string().datetime().nullable().optional(),
    /** Время остановки */
    stoppedAt: z.string().datetime().nullable().optional(),
    /** Сообщение об ошибке */
    errorMessage: z.string().nullable().optional(),
  })
  .openapi("PublicBotInstance");

/** Ответ GET /api/tokens/{tokenId}/bot-status */
export const BotStatusByTokenResponseSchema = z
  .object({
    /** Актуальный статус (сверка с процессом / worker pool) */
    status: z.enum(["running", "stopped", "error"]),
    /** Экземпляр без секрета token или null если бот никогда не запускался */
    instance: PublicBotInstanceSchema.nullable(),
  })
  .openapi("BotStatusByTokenResponse");

/** Запись истории запуска */
export const BotLaunchHistoryEntrySchema = z
  .object({
    /** ID записи */
    id: z.number().int(),
    /** ID проекта */
    projectId: z.number().int(),
    /** ID токена */
    tokenId: z.number().int(),
    /** Статус: running | stopped | error */
    status: z.enum(["running", "stopped", "error"]),
    /** Время начала */
    startedAt: z.string().datetime().nullable().optional(),
    /** Время остановки */
    stoppedAt: z.string().datetime().nullable().optional(),
    /** Текст ошибки */
    errorMessage: z.string().nullable().optional(),
    /** PID процесса */
    processId: z.string().nullable().optional(),
  })
  .openapi("BotLaunchHistoryEntry");

/** Ответ GET /api/tokens/{tokenId}/launch-history — до 10 последних записей */
export const BotLaunchHistoryListSchema = z
  .array(BotLaunchHistoryEntrySchema)
  .openapi("BotLaunchHistoryList");
