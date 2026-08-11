/**
 * @fileoverview OpenAPI: DELETE …/rows/{rowId}.
 * @module server/swagger/paths/project-tables-rows-delete-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { DatabaseCookiesSchema } from "../schemas/database";
import { RowParamsSchema } from "../schemas/project-tables-params";
import { TablesSuccessSchema } from "../schemas/project-tables-rows";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import { TABLES_SUCCESS_EXAMPLE } from "./project-tables-examples";

/**
 * Регистрирует удаление строки.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesRowsDeletePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/projects/{id}/tables/{tableId}/rows/{rowId}",
    tags: ["project-tables"],
    summary: "Удалить строку",
    description:
      "Удаляет строку `bot_table_rows`.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s -X DELETE http://localhost:5000/api/projects/42/tables/1/rows/10 \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: RowParamsSchema,
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
        description: "Некорректный rowId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Некорректный ID строки" },
          },
        },
      },
      ...PROJECT_TABLES_AUTH_ERRORS,
      404: {
        description: "Строка не найдена",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Строка не найдена" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось удалить строку" },
          },
        },
      },
    },
  });
}
