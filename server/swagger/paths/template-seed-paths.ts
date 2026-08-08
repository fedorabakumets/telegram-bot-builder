/**
 * @fileoverview OpenAPI paths: admin seed templates refresh|recreate.
 * @module server/swagger/paths/template-seed-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { TemplateSeedOkSchema } from "../schemas/templates";
import {
  ADMIN_SECURITY,
  AdminCookiesSchema,
  AdminUnauthorizedSchema,
} from "../schemas/admin-common";
import {
  ADMIN_CURL_LOGIN,
  ADMIN_TEMPLATE_SEED_OK_EXAMPLE,
  ADMIN_UNAUTHORIZED_EXAMPLE,
} from "./admin-examples";

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
      "**Авторизация:** только `admin_auth`. User cookie/PAT → 401.\n" +
      "Публичные `/api/templates/refresh|recreate` удалены.\n\n" +
      "```bash\n" +
      `${ADMIN_CURL_LOGIN}\n` +
      "curl -s -X POST http://localhost:5000/admin/api/templates/refresh -b admin.txt\n" +
      "```",
    security: ADMIN_SECURITY,
    request: { cookies: AdminCookiesSchema },
    responses: {
      200: {
        description: "Seed выполнен",
        content: {
          "application/json": {
            schema: TemplateSeedOkSchema,
            example: ADMIN_TEMPLATE_SEED_OK_EXAMPLE,
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
      "Тот же `seedDefaultTemplates(true)`, что refresh. Только admin cookie.\n\n" +
      "```bash\n" +
      `${ADMIN_CURL_LOGIN}\n` +
      "curl -s -X POST http://localhost:5000/admin/api/templates/recreate -b admin.txt\n" +
      "```",
    security: ADMIN_SECURITY,
    request: { cookies: AdminCookiesSchema },
    responses: {
      200: {
        description: "Seed выполнен",
        content: {
          "application/json": {
            schema: TemplateSeedOkSchema,
            example: {
              ...ADMIN_TEMPLATE_SEED_OK_EXAMPLE,
              message: "Templates recreated successfully",
            },
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
