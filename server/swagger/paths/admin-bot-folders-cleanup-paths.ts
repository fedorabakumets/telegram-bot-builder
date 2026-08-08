/**
 * @fileoverview OpenAPI: POST /admin/api/bot-folders/cleanup.
 * @module server/swagger/paths/admin-bot-folders-cleanup-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { MessageErrorSchema } from "../schemas/common";
import { AdminBotFoldersCleanupOkSchema } from "../schemas/bot-folders";

const adminSecurity = [{ adminCookie: [] as string[] }];

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
    summary: "Удалить осиротевшие папки в bots/",
    description:
      "Служебная уборка диска: сканирует `bots/`, парсит имена " +
      "`…_{projectId}_{tokenId}` и **рекурсивно удаляет** каталоги, " +
      "для которых нет проекта в БД.\n\n" +
      "**Авторизация:** только admin cookie (`ADMIN_API_KEY` → `/admin/login`). " +
      "Обычный user cookie / Bearer PAT → **401** `ADMIN_UNAUTHORIZED`.\n\n" +
      "Папки с нераспознанным именем попадают в `skipped` и **не** удаляются.\n" +
      "При удалении проекта папки чистятся отдельно; этот эндпоинт — для хвостов после сбоев.\n\n" +
      "**Было:** `POST /api/bot-folders/cleanup` (любой залогиненный) — **удалено**.\n\n" +
      "```bash\n" +
      "# 1) войти в admin (получить cookie)\n" +
      "curl -s -c admin.txt -X POST http://localhost:5000/admin/api/login \\\n" +
      "  -H 'Content-Type: application/x-www-form-urlencoded' \\\n" +
      "  -d 'key=YOUR_ADMIN_API_KEY'\n\n" +
      "# 2) cleanup\n" +
      "curl -s -X POST http://localhost:5000/admin/api/bot-folders/cleanup -b admin.txt\n" +
      "```",
    security: adminSecurity,
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
            schema: z.object({ error: z.string() }),
            example: { error: "ADMIN_UNAUTHORIZED" },
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
