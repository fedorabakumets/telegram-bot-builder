/**
 * @fileoverview OpenAPI: GET/PUT /admin/api/app-settings.
 * @module server/swagger/paths/admin-app-settings-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { SetupErrorSchema } from "../schemas/config";
import {
  AdminAppSettingsPayloadSchema,
  AdminAppSettingsResponseSchema,
  AdminAppSettingsSaveSchema,
} from "../schemas/config";
import {
  ADMIN_SECURITY,
  AdminCookiesSchema,
  AdminUnauthorizedSchema,
} from "../schemas/admin-common";
import {
  ADMIN_APP_SETTINGS_GET_EXAMPLE,
  ADMIN_APP_SETTINGS_PUT_BODY_EXAMPLE,
  ADMIN_APP_SETTINGS_SAVE_EXAMPLE,
  ADMIN_CURL_LOGIN,
  ADMIN_UNAUTHORIZED_EXAMPLE,
} from "./admin-examples";

/**
 * Регистрирует admin paths для app_settings.
 * @param registry - Реестр zod-to-openapi
 * @returns void
 */
export function registerAdminAppSettingsPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/admin/api/app-settings",
    tags: ["admin"],
    summary: "Настройки платформы (вход Studio + Telegram)",
    description:
      "Читает режим входа Studio (`dev_login` | `telegram_widget`) и статус " +
      "Telegram-провайдера. Секреты **не** отдаются — только флаги `*Configured`.\n\n" +
      "**Auth:** cookie `admin_auth`. **UI:** `/admin/settings` (SSR; GET для curl/Swagger).\n\n" +
      "```bash\n" +
      `${ADMIN_CURL_LOGIN}\n` +
      "curl -s http://localhost:5000/admin/api/app-settings -b admin.txt\n" +
      "```",
    security: ADMIN_SECURITY,
    request: { cookies: AdminCookiesSchema },
    responses: {
      200: {
        description: "Текущие настройки",
        content: {
          "application/json": {
            schema: AdminAppSettingsResponseSchema,
            example: ADMIN_APP_SETTINGS_GET_EXAMPLE,
          },
        },
      },
      401: {
        description: "Нет admin-сессии",
        content: {
          "application/json": {
            schema: AdminUnauthorizedSchema,
            example: ADMIN_UNAUTHORIZED_EXAMPLE,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/admin/api/app-settings",
    tags: ["admin"],
    summary: "Сохранить настройки платформы",
    description:
      "Upsert секций `auth` (режим входа) и `telegram` (Client ID / secret / bot token / username). " +
      "Пустой `clientSecret` / `botToken` не затирает уже сохранённые значения.\n\n" +
      "При `dev_login` поля Telegram необязательны. `botUsername` можно не слать — " +
      "резолв через getMe при заданном bot token.\n\n" +
      "**UI:** форма `/admin/settings`.\n\n" +
      "```bash\n" +
      `${ADMIN_CURL_LOGIN}\n` +
      "curl -s -X PUT http://localhost:5000/admin/api/app-settings -b admin.txt \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"auth\":{\"loginMode\":\"dev_login\"}}'\n" +
      "```",
    security: ADMIN_SECURITY,
    request: {
      cookies: AdminCookiesSchema,
      body: {
        required: true,
        content: {
          "application/json": {
            schema: AdminAppSettingsPayloadSchema,
            example: ADMIN_APP_SETTINGS_PUT_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Настройки сохранены",
        content: {
          "application/json": {
            schema: AdminAppSettingsSaveSchema,
            example: ADMIN_APP_SETTINGS_SAVE_EXAMPLE,
          },
        },
      },
      400: {
        description: "Валидация секции auth/telegram",
        content: {
          "application/json": {
            schema: SetupErrorSchema,
            example: { error: "telegram.clientId обязателен" },
          },
        },
      },
      401: {
        description: "Нет admin-сессии",
        content: {
          "application/json": {
            schema: AdminUnauthorizedSchema,
            example: ADMIN_UNAUTHORIZED_EXAMPLE,
          },
        },
      },
      500: {
        description: "Внутренняя ошибка",
        content: {
          "application/json": {
            schema: SetupErrorSchema,
            example: { error: "Внутренняя ошибка сервера" },
          },
        },
      },
    },
  });
}
