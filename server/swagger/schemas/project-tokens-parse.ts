/**
 * @fileoverview Схемы POST …/tokens/parse (Telegram getMe).
 * @module server/swagger/schemas/project-tokens-parse
 */

import "./common";
import { z } from "zod";

/** Тело parse */
export const ParseTokenRequestSchema = z
  .object({
    /** Сырой Telegram bot token */
    token: z.string().min(1).openapi({
      example: "7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw",
      description: "Полный bot token от @BotFather",
    }),
  })
  .openapi("ParseTokenRequest");

/** Успешный ответ parse */
export const ParseTokenResponseSchema = z
  .object({
    /** first_name из getMe */
    botFirstName: z.string().openapi({ example: "My Bot" }),
    /** username */
    botUsername: z.string().openapi({ example: "my_bot" }),
    /** getMyDescription */
    botDescription: z.string().nullable().openapi({ example: "Описание" }),
    /** getMyShortDescription */
    botShortDescription: z.string().nullable().openapi({ example: "Кратко" }),
    /** URL фото (может содержать token в path!) */
    botPhotoUrl: z.string().nullable(),
    /** can_join_groups → 0/1 */
    botCanJoinGroups: z.number().int().openapi({ example: 1 }),
    /** can_read_all_group_messages → 0/1 */
    botCanReadAllGroupMessages: z.number().int().openapi({ example: 0 }),
    /** supports_inline_queries → 0/1 */
    botSupportsInlineQueries: z.number().int().openapi({ example: 0 }),
    /** has_main_web_app → 0/1 */
    botHasMainWebApp: z.number().int().openapi({ example: 0 }),
  })
  .openapi("ParseTokenResponse");

/** Ошибка parse / Telegram */
export const ParseTokenErrorSchema = z
  .object({
    /** Сообщение */
    message: z.string().openapi({ example: "Token is required" }),
    /** Детали Telegram / сети */
    error: z.string().optional(),
    /** Подсказка (прокси) */
    details: z.string().optional(),
    /** Маска токена в логах */
    tokenMasked: z.string().optional(),
  })
  .openapi("ParseTokenError");
