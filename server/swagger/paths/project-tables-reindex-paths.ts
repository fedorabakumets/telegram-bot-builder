/**
 * @fileoverview OpenAPI: POST …/tables/{tableId}/rows/reindex.
 * @module server/swagger/paths/project-tables-reindex-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { DatabaseCookiesSchema } from "../schemas/database";
import { TableIdParamsSchema } from "../schemas/project-tables-params";
import { TablesSuccessSchema } from "../schemas/project-tables-rows";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import { TABLES_SUCCESS_EXAMPLE } from "./project-tables-examples";

/**
 * Регистрирует переиндексацию строк (до stub `:rowId`).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesReindexPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/tables/{tableId}/rows/reindex",
    tags: ["project-tables"],
    summary: "Переиндексировать строки",
    description:
      "Пересчитывает `rowIndex` строк таблицы. В Express регистрируется **до** " +
      "`/rows/:rowId`, чтобы `reindex` не воспринимался как rowId.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/tables/1/rows/reindex \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: TableIdParamsSchema,
    },
    responses: {
      200: {
        description: "Индексы обновлены",
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
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось переиндексировать строки" },
          },
        },
      },
    },
  });
}
