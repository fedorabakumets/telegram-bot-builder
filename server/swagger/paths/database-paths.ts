/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/tables.
 * @module server/swagger/paths/database-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import {
  BotTableListSchema,
  DatabaseCookiesSchema,
  DatabaseProjectIdParamsSchema,
} from "../schemas/database";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import { TABLES_LIST_EXAMPLE } from "./project-tables-examples";

/**
 * Регистрирует OpenAPI path списка bot_tables.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security requirement
 * @returns void
 */
export function registerDatabasePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/tables",
    tags: ["project-tables"],
    summary: "Список таблиц контента проекта",
    description:
      "Пользовательские таблицы `bot_tables` для панели Database в редакторе.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/projects/42/tables -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: DatabaseProjectIdParamsSchema,
    },
    responses: {
      200: {
        description: "Массив таблиц",
        content: {
          "application/json": {
            schema: BotTableListSchema,
            example: TABLES_LIST_EXAMPLE,
          },
        },
      },
      400: {
        description: "Некорректный ID проекта",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Некорректный ID проекта" },
          },
        },
      },
      ...PROJECT_TABLES_AUTH_ERRORS,
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось получить таблицы" },
          },
        },
      },
    },
  });
}
