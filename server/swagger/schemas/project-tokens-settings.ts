/**
 * @fileoverview Схемы настроек токена: toggles, log-level, launch.
 * @module server/swagger/schemas/project-tokens-settings
 */

import "./common";
import { z } from "zod";

/** Флаг 0|1 */
const flag01 = z.union([z.literal(0), z.literal(1)]);

/** PUT auto-restart */
export const AutoRestartRequestSchema = z
  .object({
    /** 0/1 автоперезапуск */
    autoRestart: flag01.openapi({ example: 1 }),
    /** Попыток подряд (1–10) */
    maxRestartAttempts: z.number().int().min(1).max(10).openapi({ example: 3 }),
  })
  .openapi("AutoRestartRequest");

/** Ответ auto-restart */
export const AutoRestartResponseSchema = z
  .object({
    /** Успех */
    success: z.literal(true),
    /** Сохранённый флаг */
    autoRestart: flag01,
    /** Сохранённый лимит */
    maxRestartAttempts: z.number().int(),
  })
  .openapi("AutoRestartResponse");

/** PUT protect-content */
export const ProtectContentRequestSchema = z
  .object({
    /** 0/1 защита контента */
    protectContent: flag01.openapi({ example: 1 }),
  })
  .openapi("ProtectContentRequest");

/** Ответ protect-content */
export const ProtectContentResponseSchema = z
  .object({ success: z.literal(true), protectContent: flag01 })
  .openapi("ProtectContentResponse");

/** PUT save-incoming-media */
export const SaveIncomingMediaRequestSchema = z
  .object({
    /** 0/1 сохранять входящие медиа */
    saveIncomingMedia: flag01.openapi({ example: 1 }),
  })
  .openapi("SaveIncomingMediaRequest");

/** Ответ save-incoming-media */
export const SaveIncomingMediaResponseSchema = z
  .object({ success: z.literal(true), saveIncomingMedia: flag01 })
  .openapi("SaveIncomingMediaResponse");

/** PUT catch-all-handlers */
export const CatchAllHandlersRequestSchema = z
  .object({
    /** 0/1 генерировать catch-all */
    catchAllHandlers: flag01.openapi({ example: 1 }),
  })
  .openapi("CatchAllHandlersRequest");

/** Ответ catch-all-handlers */
export const CatchAllHandlersResponseSchema = z
  .object({ success: z.literal(true), catchAllHandlers: flag01 })
  .openapi("CatchAllHandlersResponse");

/** PUT content-cache */
export const ContentCacheRequestSchema = z
  .object({
    /** 0/1 живое обновление _content */
    contentCache: flag01.openapi({ example: 1 }),
  })
  .openapi("ContentCacheRequest");

/** Ответ content-cache */
export const ContentCacheResponseSchema = z
  .object({ success: z.literal(true), contentCache: flag01 })
  .openapi("ContentCacheResponse");

/** PUT log-level */
export const LogLevelRequestSchema = z
  .object({
    /** Уровень Python-логов */
    logLevel: z
      .enum(["DEBUG", "INFO", "WARNING", "ERROR"])
      .openapi({ example: "WARNING" }),
  })
  .openapi("LogLevelRequest");

/** Ответ log-level */
export const LogLevelResponseSchema = z
  .object({
    success: z.literal(true),
    logLevel: z.enum(["DEBUG", "INFO", "WARNING", "ERROR"]),
  })
  .openapi("LogLevelResponse");

/** PUT launch-settings */
export const LaunchSettingsRequestSchema = z
  .object({
    /** Режим запуска */
    launchMode: z.enum(["polling", "webhook"]).openapi({ example: "webhook" }),
    /** Базовый URL webhook */
    webhookBaseUrl: z.string().nullable().optional().openapi({
      example: "https://example.com",
    }),
    /** Секрет webhook */
    webhookSecretToken: z.string().nullable().optional(),
  })
  .openapi("LaunchSettingsRequest");

/** Ответ launch-settings (может вернуть секрет!) */
export const LaunchSettingsResponseSchema = z
  .object({
    success: z.literal(true),
    launchMode: z.enum(["polling", "webhook"]),
    webhookBaseUrl: z.string().nullable().optional(),
    webhookSecretToken: z.string().nullable().optional(),
  })
  .openapi("LaunchSettingsResponse");

/** PUT bot-info */
export const BotInfoUpdateRequestSchema = z
  .object({
    /** Поле: name | description | shortDescription */
    field: z
      .enum(["name", "description", "shortDescription"])
      .openapi({ example: "name" }),
    /** Новое значение */
    value: z.string().openapi({ example: "Новое имя бота" }),
  })
  .openapi("BotInfoUpdateRequest");

/** Ответ bot-info */
export const BotInfoUpdateResponseSchema = z
  .object({
    success: z.literal(true),
    field: z.string(),
    value: z.string(),
  })
  .openapi("BotInfoUpdateResponse");
