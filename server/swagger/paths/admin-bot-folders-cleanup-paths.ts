/**
 * @fileoverview OpenAPI: POST /admin/api/bot-folders/cleanup.
 * @module server/swagger/paths/admin-bot-folders-cleanup-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { AdminBotFoldersCleanupOkSchema } from "../schemas/bot-folders";
import {
  ADMIN_SECURITY,
  AdminCookiesSchema,
  AdminUnauthorizedSchema,
} from "../schemas/admin-common";
import { ADMIN_CURL_LOGIN, ADMIN_UNAUTHORIZED_EXAMPLE } from "./admin-examples";

/**
 * Регистрирует admin-only очистку осиротевших папок ботов.
 * @param registry - Реестр zod-to-openapi
 * @returns void
 */
export function registerAdminBotFoldersCleanupPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "post",
    path: "/admin/api/bot-folders/cleanup",
    tags: ["admin"],
    summary: "Очистить осиротевшие папки bots/",
    description:
      "Сканирует каталог `bots/`, парсит имена `…_{projectId}_{tokenId}` и удаляет " +
      "папки, чей проект уже нет в БД. Непонятные имена → `skipped` (не трогает).\n\n" +
      "**Auth:** только `admin_auth`. Ops / curl / Swagger (UI в hub пока нет).\n\n" +
      "```bash\n" +
      `${ADMIN_CURL_LOGIN}\n` +
      "curl -s -X POST http://localhost:5000/admin/api/bot-folders/cleanup -b admin.txt\n" +
      "```",
    security: ADMIN_SECURITY,
    request: { cookies: AdminCookiesSchema },
    responses: {
      200: {
        description: "Очистка выполнена (возможно 0 удалений)",
        content: {
          "application/json": {
            schema: AdminBotFoldersCleanupOkSchema,
            example: {
              deleted: ["bot_999_1"],
              skipped: [],
              count: 1,
              message: "Удалено 1 папок",
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
        description: "Ошибка чтения БД или fs",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Ошибка при очистке папок" },
          },
        },
      },
    },
  });
}
