/**
 * @fileoverview OpenAPI: GET/POST колонок таблицы.
 * @module server/swagger/paths/project-tables-columns-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { DatabaseCookiesSchema } from "../schemas/database";
import {
  BotTableColumnListSchema,
  BotTableColumnSchema,
  CreateBotTableColumnBodySchema,
} from "../schemas/project-tables-columns";
import { TableIdParamsSchema } from "../schemas/project-tables-params";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import {
  COLUMN_EXAMPLE,
  COLUMNS_LIST_EXAMPLE,
  CREATE_COLUMN_BODY_EXAMPLE,
} from "./project-tables-examples";

/**
 * Регистрирует список и создание колонок.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesColumnsPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/tables/{tableId}/columns",
    tags: ["project-tables"],
    summary: "Список колонок таблицы",
    description:
      "Колонки `bot_table_columns` для панели Database.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/projects/42/tables/1/columns -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: TableIdParamsSchema,
    },
    responses: {
      200: {
        description: "Массив колонок",
        content: {
          "application/json": {
            schema: BotTableColumnListSchema,
            example: COLUMNS_LIST_EXAMPLE,
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
            example: { message: "Не удалось получить колонки" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/tables/{tableId}/columns",
    tags: ["project-tables"],
    summary: "Создать колонку",
    description:
      "Тело: `{ name, position? }` — `position` по умолчанию `0`.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess`.\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/tables/1/columns \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"name\":\"Цена\",\"position\":0}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: TableIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: CreateBotTableColumnBodySchema,
            example: CREATE_COLUMN_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Созданная колонка",
        content: {
          "application/json": {
            schema: BotTableColumnSchema,
            example: COLUMN_EXAMPLE,
          },
        },
      },
      400: {
        description: "Нет name или некорректный tableId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Название колонки обязательно" },
          },
        },
      },
      ...PROJECT_TABLES_AUTH_ERRORS,
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось создать колонку" },
          },
        },
      },
    },
  });
}
