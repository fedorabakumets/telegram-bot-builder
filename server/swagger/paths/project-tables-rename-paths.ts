/**
 * @fileoverview OpenAPI: PUT /api/projects/{id}/tables/{tableId}.
 * @module server/swagger/paths/project-tables-rename-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import {
  BotTableSchema,
  DatabaseCookiesSchema, DatabaseAuthHeadersSchema,
  RenameBotTableBodySchema,
} from "../schemas/database";
import { TableIdParamsSchema } from "../schemas/project-tables-params";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import {
  RENAME_TABLE_BODY_EXAMPLE,
  TABLE_EXAMPLE,
} from "./project-tables-examples";

/**
 * Регистрирует переименование bot_tables.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesRenamePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/{id}/tables/{tableId}",
    tags: ["project-tables"],
    summary: "Переименовать таблицу",
    description:
      "Обновляет `name`. API есть; UI-хук `useRenameTable` в TablesPanel не подключён.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api.renameTable`.\n\n" +
      "```bash\n" +
      "curl -s -X PUT http://localhost:5000/api/projects/42/tables/1 -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"name\":\"Услуги\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      headers: DatabaseAuthHeadersSchema,
      params: TableIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: RenameBotTableBodySchema,
            example: RENAME_TABLE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Обновлённая таблица",
        content: {
          "application/json": {
            schema: BotTableSchema,
            example: { ...TABLE_EXAMPLE, name: "Услуги" },
          },
        },
      },
      400: {
        description: "Нет name или некорректный tableId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Новое название обязательно" },
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
            example: { message: "Не удалось переименовать таблицу" },
          },
        },
      },
    },
  });
}
