/**
 * @fileoverview OpenAPI: POST /api/projects/{id}/tables.
 * @module server/swagger/paths/project-tables-create-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import {
  BotTableSchema,
  CreateBotTableBodySchema,
  DatabaseCookiesSchema,
  DatabaseProjectIdParamsSchema,
} from "../schemas/database";
import { PROJECT_TABLES_AUTH_ERRORS } from "./project-tables-errors";
import {
  CREATE_TABLE_BODY_EXAMPLE,
  TABLE_EXAMPLE,
} from "./project-tables-examples";

/**
 * Регистрирует создание bot_tables.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTablesCreatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/tables",
    tags: ["project-tables"],
    summary: "Создать таблицу контента",
    description:
      "Создаёт `bot_tables` с полем `name`.\n\n" +
      "**Auth:** `requireDbReady` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `tables-api` → TablesPanel.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/tables -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"name\":\"Товары\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: DatabaseCookiesSchema,
      params: DatabaseProjectIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: CreateBotTableBodySchema,
            example: CREATE_TABLE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Созданная таблица",
        content: {
          "application/json": { schema: BotTableSchema, example: TABLE_EXAMPLE },
        },
      },
      400: {
        description: "Нет name или некорректный ID проекта",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            examples: {
              missingName: {
                summary: "Нет name",
                value: { message: "Название таблицы обязательно" },
              },
              badId: {
                summary: "Плохой id",
                value: { message: "Некорректный ID проекта" },
              },
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
            example: { message: "Не удалось создать таблицу" },
          },
        },
      },
    },
  });
}
