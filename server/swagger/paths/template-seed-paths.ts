/**
 * @fileoverview OpenAPI paths: admin seed `/admin/api/templates/refresh|recreate`.
 * @module server/swagger/paths/template-seed-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { MessageErrorSchema } from "../schemas/common";
import { TemplateSeedOkSchema } from "../schemas/templates";

const adminSecurity = [{ adminCookie: [] as string[] }];

/**
 * Регистрирует admin-only seed системных сценариев.
 * @param registry - Реестр zod-to-openapi
 * @returns void
 */
export function registerTemplateSeedPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "post",
    path: "/admin/api/templates/refresh",
    tags: ["admin"],
    summary: "Пересидить системные сценарии (force)",
    description:
      "`seedDefaultTemplates(true)` — принудительное обновление системных шаблонов.\n\n" +
      "**Авторизация:** только admin cookie (`ADMIN_API_KEY` → `/admin/login`). " +
      "Обычный user cookie/PAT → 401.\n\n" +
      "Пути `/api/templates/refresh` и `/recreate` удалены (раньше были без admin-проверки).",
    security: adminSecurity,
    responses: {
      200: {
        description: "Seed выполнен",
        content: {
          "application/json": {
            schema: TemplateSeedOkSchema,
            example: {
              message: "Templates refreshed successfully",
              timestamp: "2026-08-08T19:00:00.000Z",
            },
          },
        },
      },
      401: {
        description: "Нет admin-сессии",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
            example: { error: "ADMIN_UNAUTHORIZED" },
          },
        },
      },
      500: {
        description: "Ошибка seed",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to refresh templates" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/admin/api/templates/recreate",
    tags: ["admin"],
    summary: "Пересоздать системные сценарии (seed force)",
    description:
      "Тот же `seedDefaultTemplates(true)`, что refresh. Только admin cookie.",
    security: adminSecurity,
    responses: {
      200: {
        description: "Seed выполнен",
        content: {
          "application/json": {
            schema: TemplateSeedOkSchema,
            example: {
              message: "Templates recreated successfully",
              timestamp: "2026-08-08T19:00:00.000Z",
            },
          },
        },
      },
      401: {
        description: "Нет admin-сессии",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
            example: { error: "ADMIN_UNAUTHORIZED" },
          },
        },
      },
      500: {
        description: "Ошибка seed",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to recreate templates" },
          },
        },
      },
    },
  });
}
