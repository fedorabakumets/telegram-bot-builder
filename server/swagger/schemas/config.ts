/**
 * @fileoverview OpenAPI-схемы публичной конфигурации и setup status
 * @module server/swagger/schemas/config
 */

import "./common";
import { z } from "zod";

/** Ответ GET /api/config — bootstrap AuthScreen (не конфиг бота) */
export const PublicConfigSchema = z
  .object({
    /** Client ID Telegram Login Widget; 0 = не задан */
    telegramClientId: z.number().openapi({
      example: 12345678,
      description: "Client ID виджета входа; 0 — виджет ещё не настроен",
    }),
    /** Username бота для виджета (без @); пусто = не задан */
    telegramBotUsername: z.string().openapi({
      example: "my_bot",
      description: "Username бота для Login Widget без @",
    }),
    /** true = показать форму dev-login вместо виджета */
    skipAuth: z.boolean().openapi({
      example: false,
      description: "true при auth_login_mode=dev_login; false при telegram_widget",
    }),
  })
  .openapi("PublicConfig");

/** Ответ GET /api/setup/status */
export const SetupStatusSchema = z
  .object({
    /** true — platform setup завершён */
    configured: z.boolean().openapi({ example: true }),
  })
  .openapi("SetupStatus");

/** Ответ GET /api/setup/bootstrap */
export const SetupBootstrapSchema = z
  .object({
    /** true — platform setup завершён */
    configured: z.boolean().openapi({ example: false }),
    /** true — вход в /admin доступен (ADMIN_API_KEY или dev-fallback) */
    adminEnabled: z.boolean().openapi({ example: true }),
  })
  .openapi("SetupBootstrap");

/** Секция auth в GET /admin/api/app-settings */
export const AdminAuthSettingsSchema = z
  .object({
    /** Режим входа: dev_login или telegram_widget */
    loginMode: z.enum(["dev_login", "telegram_widget"]).openapi({ example: "dev_login" }),
    /** true если dev-login активен */
    devLoginEnabled: z.boolean().openapi({ example: true }),
  })
  .openapi("AdminAuthSettings");

/** Секция Telegram в GET /admin/api/app-settings */
export const AdminTelegramProviderSchema = z
  .object({
    /** Client ID */
    clientId: z.string().openapi({ example: "123456789" }),
    /** Username бота */
    botUsername: z.string().openapi({ example: "my_bot" }),
    /** Client secret задан в БД */
    clientSecretConfigured: z.boolean().openapi({ example: true }),
    /** Bot token задан в БД */
    botTokenConfigured: z.boolean().openapi({ example: true }),
    /** Telegram провайдер полностью настроен */
    configured: z.boolean().openapi({ example: true }),
  })
  .openapi("AdminTelegramProvider");

/** Ответ GET /admin/api/app-settings */
export const AdminAppSettingsResponseSchema = z
  .object({
    /** Platform setup завершён */
    configured: z.boolean(),
    /** Режим входа */
    auth: AdminAuthSettingsSchema,
    /** Настройки по провайдерам */
    providers: z.object({
      /** Telegram Login */
      telegram: AdminTelegramProviderSchema,
    }),
  })
  .openapi("AdminAppSettingsResponse");

/** Тело PUT /admin/api/app-settings — секция auth */
export const AdminAuthSettingsPayloadSchema = z
  .object({
    /** Режим входа */
    loginMode: z.enum(["dev_login", "telegram_widget"]).openapi({ example: "dev_login" }),
  })
  .openapi("AdminAuthSettingsPayload");

/** Тело PUT /admin/api/app-settings — секция telegram */
export const AdminTelegramSettingsPayloadSchema = z
  .object({
    /** Client ID */
    clientId: z.union([z.string(), z.number()]).openapi({ example: "123456789" }),
    /** Client secret (пустое — не менять) */
    clientSecret: z.string().optional(),
    /** Username без @ */
    botUsername: z.string().optional(),
    /** Bot token (пустое — не менять) */
    botToken: z.string().optional(),
  })
  .openapi("AdminTelegramSettingsPayload");

/** Тело PUT /admin/api/app-settings */
export const AdminAppSettingsPayloadSchema = z
  .object({
    /** Секция auth (режим входа) */
    auth: AdminAuthSettingsPayloadSchema.optional(),
    /** Секция Telegram */
    telegram: AdminTelegramSettingsPayloadSchema.optional(),
  })
  .openapi("AdminAppSettingsPayload");

/** Ошибка setup/admin settings (поле error) */
export const SetupErrorSchema = z
  .object({
    /** Текст ошибки */
    error: z.string().openapi({ example: "telegram.clientId обязателен" }),
  })
  .openapi("SetupError");

/** Успешный ответ PUT /admin/api/app-settings */
export const AdminAppSettingsSaveSchema = z
  .object({
    /** Операция выполнена */
    success: z.literal(true),
    /** Platform configured после сохранения */
    configured: z.boolean(),
    /** Режим входа после сохранения */
    auth: AdminAuthSettingsSchema,
    /** Обновлённые провайдеры */
    providers: z.object({
      /** Telegram */
      telegram: z.object({
        /** Username после save */
        botUsername: z.string().optional(),
        /** Telegram configured */
        configured: z.boolean(),
      }),
    }),
  })
  .openapi("AdminAppSettingsSave");
