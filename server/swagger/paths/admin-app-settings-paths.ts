/**
 * @fileoverview OpenAPI paths для admin app-settings
 * @module server/swagger/paths/admin-app-settings-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { SetupErrorSchema } from "../schemas/config";
import {
  AdminAppSettingsPayloadSchema,
  AdminAppSettingsResponseSchema,
  AdminAppSettingsSaveSchema,
} from "../schemas/config";

/**
 * Регистрирует admin paths для app_settings.
 * @param registry - Реестр zod-to-openapi
 * @returns void
 */
export function registerAdminAppSettingsPaths(
  registry: OpenAPIRegistry,
): void {
  registry.registerPath({
    method: "get",
    path: "/admin/api/app-settings",
    tags: ["admin"],
    summary: "Настройки приложения (по провайдерам)",
    description:
      "Требует admin cookie после `/admin/login`. Секреты и токены **не** возвращаются — только флаги `*Configured`.",
    security: [{ adminCookie: [] as string[] }],
    responses: {
      200: {
        description: "Текущие настройки",
        content: {
          "application/json": { schema: AdminAppSettingsResponseSchema },
        },
      },
      401: {
        description: "Не авторизован в admin",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/admin/api/app-settings",
    tags: ["admin"],
    summary: "Сохранить настройки приложения",
    description:
      "Upsert по секциям провайдеров. Пустой `clientSecret` / `botToken` не удаляет существующие значения. " +
      "`botUsername` опционально — резолв через getMe при заданном token.",
    security: [{ adminCookie: [] as string[] }],
    request: {
      body: {
        content: {
          "application/json": { schema: AdminAppSettingsPayloadSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Настройки сохранены",
        content: {
          "application/json": { schema: AdminAppSettingsSaveSchema },
        },
      },
      400: {
        description: "Валидация",
        content: { "application/json": { schema: SetupErrorSchema } },
      },
      401: {
        description: "Не авторизован в admin",
        content: { "application/json": { schema: SetupErrorSchema } },
      },
      500: {
        description: "Внутренняя ошибка",
        content: { "application/json": { schema: SetupErrorSchema } },
      },
    },
  });
}
