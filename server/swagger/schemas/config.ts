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
