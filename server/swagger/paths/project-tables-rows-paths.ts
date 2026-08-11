/**
 * @fileoverview OpenAPI: GET/POST строк таблицы.
 * @module server/swagger/paths/project-tables-rows-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { DatabaseCookiesSchema } from "../schemas/database";
import { TableIdParamsSchema } from "../schemas/project-tables-params";
import {
  BotTableRowListSchema,
  BotTableRowSchema,
  CreateBotTableRowsBodySchema,
} from "../schemas/project-tables-rows";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import {
  CREATE_ROWS_BODY_EXAMPLE,
  ROW_EXAMPLE,
  ROWS_LIST_EXAMPLE,
} from "./project-tables-examples";

/**
 * Регистрирует список и батч-создание строк.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesRowsPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/tables/{tableId}/rows",
    tags: ["project-tables"],
    summary: "Список строк таблицы",
    description:
      "Строки `bot_table_rows` с `data: Record<string,string>`.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/projects/42/tables/1/rows -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: TableIdParamsSchema,
    },
    responses: {
      200: {
        description: "Массив строк",
        content: {
          "application/json": {
            schema: BotTableRowListSchema,
            example: ROWS_LIST_EXAMPLE,
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
            example: { message: "Не удалось получить строки" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/tables/{tableId}/rows",
    tags: ["project-tables"],
    summary: "Создать строки (батч)",
    description:
      "Тело `{ rows: [{ rowIndex?, data? }] }` — массив **непустой**. " +
      "Без `rowIndex` берётся индекс в массиве; `data` по умолчанию `{}`.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess`.\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/tables/1/rows \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"rows\":[{\"rowIndex\":0,\"data\":{\"3\":\"100\"}}]}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: TableIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: CreateBotTableRowsBodySchema,
            example: CREATE_ROWS_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Созданные строки",
        content: {
          "application/json": {
            schema: BotTableRowListSchema,
            example: [ROW_EXAMPLE],
          },
        },
      },
      400: {
        description: "Пустой rows или некорректный tableId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: {
              message: "Массив rows обязателен и не может быть пустым",
            },
          },
        },
      },
      ...PROJECT_TABLES_AUTH_ERRORS,
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось создать строки" },
          },
        },
      },
    },
  });
}
