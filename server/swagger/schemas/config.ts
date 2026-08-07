/**
 * @fileoverview OpenAPI-схемы публичной конфигурации и setup wizard
 * @module server/swagger/schemas/config
 */

import "./common";
import { z } from "zod";

/** Ответ GET /api/config */
export const PublicConfigSchema = z
  .object({
    /** Client ID для Telegram Login Widget */
    telegramClientId: z.number().openapi({ example: 12345678 }),
    /** Имя бота без @ */
    telegramBotUsername: z.string().openapi({ example: "my_bot" }),
    /** SKIP_AUTH=true — вход отключён */
    skipAuth: z.boolean().openapi({ example: false }),
  })
  .openapi("PublicConfig");

/** Ответ GET /api/setup/status */
export const SetupStatusSchema = z
  .object({
    /** true — wizard уже пройден */
    configured: z.boolean().openapi({ example: true }),
  })
  .openapi("SetupStatus");

/** Тело POST /api/setup */
export const SetupPayloadSchema = z
  .object({
    /** Числовой Client ID из BotFather → Web Login */
    telegramClientId: z.union([z.string(), z.number()]).openapi({ example: "123456789" }),
    /** Client Secret из BotFather → Web Login (сохраняется для isConfigured, не для Login Widget) */
    telegramClientSecret: z.string().openapi({ example: "secret_from_botfather" }),
    /** Имя бота без @ */
    telegramBotUsername: z.string().openapi({ example: "my_bot" }),
    /** Токен бота для Mini App auth (опционально) */
    telegramBotToken: z.string().optional().openapi({ example: "123456:ABC-DEF" }),
  })
  .openapi("SetupPayload");

/** Успешный ответ POST /api/setup */
export const SetupSuccessSchema = z
  .object({
    /** Операция выполнена */
    success: z.literal(true).openapi({ example: true }),
  })
  .openapi("SetupSuccess");

/** Ошибка setup-хендлеров (поле error) */
export const SetupErrorSchema = z
  .object({
    /** Текст ошибки */
    error: z.string().openapi({ example: "telegramClientId обязателен" }),
  })
  .openapi("SetupError");
