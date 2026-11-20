/**
 * @fileoverview Схемы настроек токена: toggles, log-level, launch.
 * @module server/swagger/schemas/project-tokens-settings
 */

import "./common";
import { z } from "zod";
import { BOT_INHERITED_SETTING_KEYS } from "../../../shared/bot-inherited-settings";

/** Флаг 0|1 */
const flag01 = z.union([z.literal(0), z.literal(1)]);
/** Один из двух флагов или восстановление настройки проекта. */
const inheritableFlag = z.union([flag01, z.literal("inherit")]);
/** Список настроек, берущих значение из проекта. */
const inheritedFields = z.array(z.enum(BOT_INHERITED_SETTING_KEYS));

/** PUT auto-restart */
export const AutoRestartRequestSchema = z
  .object({
    /** Индивидуальный флаг или возврат к общему. */
    autoRestart: z.union([flag01, z.literal("inherit")]).optional().openapi({ example: 1 }),
    /** Индивидуальный лимит или возврат к общему. */
    maxRestartAttempts: z.union([z.number().int().min(1).max(10), z.literal("inherit")]).optional().openapi({ example: 3 }),
  })
  .openapi("AutoRestartRequest");

/** Ответ auto-restart */
export const AutoRestartResponseSchema = z
  .object({
    /** Успех */
    success: z.literal(true),
    /** Действующий флаг. */
    autoRestart: flag01,
    /** Действующий лимит. */
    maxRestartAttempts: z.number().int(),
    /** Флаг берётся из проекта. */
    inheritAutoRestart: z.boolean(),
    /** Лимит берётся из проекта. */
    inheritMaxRestartAttempts: z.boolean(),
  })
  .openapi("AutoRestartResponse");

/** PUT protect-content */
export const ProtectContentRequestSchema = z
  .object({
    /** 0/1 защита контента */
    protectContent: inheritableFlag.openapi({ example: 1 }),
  })
  .openapi("ProtectContentRequest");

/** Ответ protect-content */
export const ProtectContentResponseSchema = z
  .object({ success: z.literal(true), protectContent: flag01, inheritBotSettings: inheritedFields })
  .openapi("ProtectContentResponse");

/** PUT save-incoming-media */
export const SaveIncomingMediaRequestSchema = z
  .object({
    /** 0/1 сохранять входящие медиа */
    saveIncomingMedia: inheritableFlag.openapi({ example: 1 }),
  })
  .openapi("SaveIncomingMediaRequest");

/** Ответ save-incoming-media */
export const SaveIncomingMediaResponseSchema = z
  .object({ success: z.literal(true), saveIncomingMedia: flag01, inheritBotSettings: inheritedFields })
  .openapi("SaveIncomingMediaResponse");

/** PUT catch-all-handlers */
export const CatchAllHandlersRequestSchema = z
  .object({
    /** 0/1 генерировать catch-all */
    catchAllHandlers: inheritableFlag.openapi({ example: 1 }),
  })
  .openapi("CatchAllHandlersRequest");

/** Ответ catch-all-handlers */
export const CatchAllHandlersResponseSchema = z
  .object({ success: z.literal(true), catchAllHandlers: flag01, inheritBotSettings: inheritedFields })
  .openapi("CatchAllHandlersResponse");

/** PUT track-user-blocks */
export const TrackUserBlocksRequestSchema = z.object({
  /** 0/1 отслеживать my_chat_member */
  trackUserBlocks: inheritableFlag.openapi({ example: 1 }),
}).openapi("TrackUserBlocksRequest");

/** Ответ track-user-blocks */
export const TrackUserBlocksResponseSchema = z.object({
  success: z.literal(true), trackUserBlocks: flag01, inheritBotSettings: inheritedFields,
}).openapi("TrackUserBlocksResponse");

/** PUT content-cache */
export const ContentCacheRequestSchema = z
  .object({
    /** 0/1 живое обновление _content */
    contentCache: inheritableFlag.openapi({ example: 1 }),
  })
  .openapi("ContentCacheRequest");

/** Ответ content-cache */
export const ContentCacheResponseSchema = z
  .object({ success: z.literal(true), contentCache: flag01, inheritBotSettings: inheritedFields })
  .openapi("ContentCacheResponse");

/** PUT log-level */
export const LogLevelRequestSchema = z
  .object({
    /** Уровень Python-логов */
    logLevel: z
      .enum(["DEBUG", "INFO", "WARNING", "ERROR", "inherit"])
      .openapi({ example: "WARNING" }),
  })
  .openapi("LogLevelRequest");

/** Ответ log-level */
export const LogLevelResponseSchema = z
  .object({
    success: z.literal(true),
    logLevel: z.enum(["DEBUG", "INFO", "WARNING", "ERROR"]),
    /** Источники настроек бота. */
    inheritBotSettings: inheritedFields,
  })
  .openapi("LogLevelResponse");

/** PUT launch-settings */
export const LaunchSettingsRequestSchema = z
  .object({
    /** Индивидуальный режим запуска или наследование настройки проекта. */
    launchMode: z.enum(["inherit", "polling", "webhook"]).optional().openapi({ example: "webhook" }),
    /** URL, null для серверного адреса, либо наследование адреса проекта. */
    webhookBaseUrl: z.union([z.url(), z.literal("inherit")]).nullable().optional().openapi({
      example: "https://example.com",
    }),
    /** Секрет webhook */
    webhookSecretToken: z.string().nullable().optional(),
  })
  .openapi("LaunchSettingsRequest");

/** Ответ записи настроек запуска без секрета вебхука. */
export const LaunchSettingsResponseSchema = z
  .object({
    success: z.literal(true),
    /** Итоговое значение для следующего запуска. */
    launchMode: z.enum(["polling", "webhook"]),
    /** Если включено, бот использует режим проекта. */
    inheritLaunchMode: z.boolean(),
    /** Адрес после разрешения проекта и бота; null означает адрес сервера. */
    webhookBaseUrl: z.string().nullable(),
    /** Включает webhookBaseUrl при использовании настройки проекта. */
    inheritBotSettings: inheritedFields,
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
