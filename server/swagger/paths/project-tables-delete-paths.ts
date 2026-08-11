/**
 * @fileoverview OpenAPI: DELETE /api/projects/{id}/tables/{tableId}.
 * @module server/swagger/paths/project-tables-delete-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { DatabaseCookiesSchema } from "../schemas/database";
import { TableIdParamsSchema } from "../schemas/project-tables-params";
import { TablesSuccessSchema } from "../schemas/project-tables-rows";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import { TABLES_SUCCESS_EXAMPLE } from "./project-tables-examples";

/**
 * Регистрирует удаление bot_tables.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesDeletePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/projects/{id}/tables/{tableId}",
    tags: ["project-tables"],
    summary: "Удалить таблицу",
    description:
      "Удаляет таблицу и связанные колонки/строки (CASCADE).\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s -X DELETE http://localhost:5000/api/projects/42/tables/1 -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: TableIdParamsSchema,
    },
    responses: {
      200: {
        description: "Удалено",
        content: {
          "application/json": {
            schema: TablesSuccessSchema,
            example: TABLES_SUCCESS_EXAMPLE,
          },
        },
      },
      400: {
        description: "Некорректный tableId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Некорректный ID таблицы" },
          },
        },
      },
      ...PROJECT_TABLES_AUTH_ERRORS,
      404: {
        description: "Таблица не найдена",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Таблица не найдена" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось удалить таблицу" },
          },
        },
      },
    },
  });
}
