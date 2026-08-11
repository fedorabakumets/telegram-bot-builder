/**
 * @fileoverview OpenAPI: DELETE …/columns/{columnId}.
 * @module server/swagger/paths/project-tables-columns-delete-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { DatabaseCookiesSchema, DatabaseAuthHeadersSchema } from "../schemas/database";
import { ColumnParamsSchema } from "../schemas/project-tables-params";
import { TablesSuccessSchema } from "../schemas/project-tables-rows";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import { TABLES_SUCCESS_EXAMPLE } from "./project-tables-examples";

/**
 * Регистрирует удаление колонки.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesColumnsDeletePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/projects/{id}/tables/{tableId}/columns/{columnId}",
    tags: ["project-tables"],
    summary: "Удалить колонку",
    description:
      "Удаляет колонку таблицы.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s -X DELETE http://localhost:5000/api/projects/42/tables/1/columns/3 \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      headers: DatabaseAuthHeadersSchema,
      params: ColumnParamsSchema,
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
        description: "Некорректный columnId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Некорректный ID колонки" },
          },
        },
      },
      ...PROJECT_TABLES_AUTH_ERRORS,
      404: {
        description: "Колонка не найдена",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Колонка не найдена" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось удалить колонку" },
          },
        },
      },
    },
  });
}
