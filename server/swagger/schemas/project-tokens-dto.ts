/**
 * @fileoverview DTO токенов проекта: публичный/полный/list/first.
 * @module server/swagger/schemas/project-tokens-dto
 */

import "./common";
import { z } from "zod";

/** Публичный токен (маска `botId:••••`, без webhook/userbot секретов) */
export const PublicBotTokenSchema = z
  .object({
    /** ID токена */
    id: z.number().int().openapi({ example: 7 }),
    /** ID проекта */
    projectId: z.number().int().openapi({ example: 42 }),
    /** Владелец (nullable) */
    ownerId: z.number().nullable().optional().openapi({ example: 123456789 }),
    /** Пользовательское имя */
    name: z.string().openapi({ example: "Основной бот" }),
    /** Маскированный Telegram token (`123456:••••••••`) */
    token: z.string().openapi({ example: "7123456789:••••••••" }),
    /** Флаг default (0/1) */
    isDefault: z.number().nullable().optional().openapi({ example: 1 }),
    /** Активен (0/1) */
    isActive: z.number().nullable().optional().openapi({ example: 1 }),
    /** Username бота */
    botUsername: z.string().nullable().optional().openapi({ example: "my_bot" }),
    /** Имя бота */
    botFirstName: z.string().nullable().optional().openapi({ example: "My Bot" }),
    /** Описание */
    botDescription: z.string().nullable().optional(),
    /** Короткое описание */
    botShortDescription: z.string().nullable().optional(),
    /** URL фото */
    botPhotoUrl: z.string().nullable().optional(),
    /** Срок хранения сообщений (дни) */
    messagesRetentionDays: z.number().int().optional().openapi({ example: 60 }),
    /** Автоперезапуск 0/1 */
    autoRestart: z.number().nullable().optional(),
    /** Макс. попыток рестарта */
    maxRestartAttempts: z.number().nullable().optional(),
    /** Уровень логов */
    logLevel: z.string().nullable().optional(),
    /** Защита контента 0/1 */
    protectContent: z.number().nullable().optional(),
    /** Сохранять входящие медиа 0/1 */
    saveIncomingMedia: z.number().nullable().optional(),
    /** Catch-all 0/1 */
    catchAllHandlers: z.number().nullable().optional(),
    /** Content cache 0/1 */
    contentCache: z.number().nullable().optional(),
    /** polling | webhook */
    launchMode: z.string().nullable().optional(),
    /** Базовый URL webhook */
    webhookBaseUrl: z.string().nullable().optional(),
    /** webhookSecretToken всегда null в public */
    webhookSecretToken: z.null().optional(),
    /** Userbot вкл. 0/1 */
    userbotEnabled: z.number().nullable().optional(),
    /** API ID (не секрет) */
    userbotApiId: z.string().nullable().optional(),
    /** userbotApiHash всегда null в public */
    userbotApiHash: z.null().optional(),
    /** session string всегда null в public */
    userbotSessionString: z.null().optional(),
    /** Числовой bot id из token (только GET …/tokens) */
    botId: z.string().nullable().optional().openapi({ example: "7123456789" }),
  })
  .openapi("PublicBotToken");

/** Полная запись при POST create/duplicate — содержит сырой token */
export const FullBotTokenSchema = PublicBotTokenSchema.omit({ botId: true })
  .extend({
    /** Сырой Telegram bot token (секрет!) */
    token: z.string().openapi({ example: "7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw" }),
    /** Секрет webhook (может быть) */
    webhookSecretToken: z.string().nullable().optional(),
    /** API Hash (секрет) */
    userbotApiHash: z.string().nullable().optional(),
    /** Session string (секрет) */
    userbotSessionString: z.string().nullable().optional(),
  })
  .openapi("FullBotToken");

/** Whitelist GET …/tokens/list */
export const BotTokenListItemSchema = z
  .object({
    /** ID токена */
    id: z.number().int().openapi({ example: 7 }),
    /** Имя */
    name: z.string().openapi({ example: "Основной бот" }),
    /** Username */
    botUsername: z.string().nullable().openapi({ example: "my_bot" }),
    /** Имя бота */
    botFirstName: z.string().nullable().openapi({ example: "My Bot" }),
    /** Default 0/1 */
    isDefault: z.number().nullable().openapi({ example: 1 }),
    /** Active 0/1 */
    isActive: z.number().nullable().openapi({ example: 1 }),
    /** ID проекта */
    projectId: z.number().int().openapi({ example: 42 }),
    /** Срок хранения сообщений */
    messagesRetentionDays: z.number().int().openapi({ example: 60 }),
  })
  .openapi("BotTokenListItem");

/** GET …/tokens/first — сырой секрет + id (codegen / env) */
export const TokensFirstResponseSchema = z
  .object({
    /** Есть ли дефолтный/любой токен проекта */
    hasToken: z.boolean().openapi({ example: true }),
    /** ID токена для …/env-variables; null если токенов нет */
    id: z.number().int().nullable().openapi({
      example: 7,
      description: "bot_tokens.id — для загрузки env-variables",
    }),
    /** Сырой Telegram token или null */
    token: z.string().nullable().openapi({
      example: "7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw",
      description: "RAW SECRET для .env. Не логировать. Cache-Control: no-store.",
    }),
  })
  .openapi("TokensFirstResponse");

/** Тело POST …/tokens (insertBotTokenSchema; projectId из URL) */
export const CreateBotTokenBodySchema = z
  .object({
    /** Имя токена */
    name: z.string().min(1).openapi({ example: "Основной бот" }),
    /** Сырой Telegram token */
    token: z.string().min(1).openapi({
      example: "7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw",
    }),
    /** Игнорируется — берётся из сессии/проекта */
    ownerId: z.number().nullable().optional(),
    /** Прочие поля insertBotTokenSchema.partial допустимы */
    botUsername: z.string().nullable().optional(),
    botFirstName: z.string().nullable().optional(),
    isDefault: z.number().optional(),
    isActive: z.number().optional(),
  })
  .passthrough()
  .openapi("CreateBotTokenBody");

/** Тело PUT …/tokens/{tokenId} — partial; маска token игнорируется */
export const UpdateBotTokenBodySchema = CreateBotTokenBodySchema.partial().openapi(
  "UpdateBotTokenBody",
);
