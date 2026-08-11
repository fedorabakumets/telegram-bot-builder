/**
 * @fileoverview OpenAPI: PUT …/columns/{columnId}.
 * @module server/swagger/paths/project-tables-columns-rename-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { DatabaseCookiesSchema } from "../schemas/database";
import {
  BotTableColumnSchema,
  RenameBotTableColumnBodySchema,
} from "../schemas/project-tables-columns";
import { ColumnParamsSchema } from "../schemas/project-tables-params";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import {
  COLUMN_EXAMPLE,
  RENAME_COLUMN_BODY_EXAMPLE,
} from "./project-tables-examples";

/**
 * Регистрирует переименование колонки.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesColumnsRenamePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/{id}/tables/{tableId}/columns/{columnId}",
    tags: ["project-tables"],
    summary: "Переименовать колонку",
    description:
      "Обновляет `name` колонки `bot_table_columns`.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s -X PUT http://localhost:5000/api/projects/42/tables/1/columns/3 \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"name\":\"Стоимость\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: ColumnParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: RenameBotTableColumnBodySchema,
            example: RENAME_COLUMN_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Обновлённая колонка",
        content: {
          "application/json": {
            schema: BotTableColumnSchema,
            example: { ...COLUMN_EXAMPLE, name: "Стоимость" },
          },
        },
      },
      400: {
        description: "Нет name или некорректный columnId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Новое название обязательно" },
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
            example: { message: "Не удалось переименовать колонку" },
          },
        },
      },
    },
  });
}
