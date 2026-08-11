/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/tables.
 * @module server/swagger/paths/database-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import {
  BotTableListSchema,
  DatabaseCookiesSchema,
  DatabaseProjectIdParamsSchema,
} from "../schemas/database";

/** Пример списка таблиц */
const TABLES_LIST_EXAMPLE = [
  {
    id: 1,
    projectId: 42,
    name: "Товары",
    createdAt: "2026-08-01T10:00:00.000Z",
  },
];

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
      "**Тег:** `project-tables` (вместе с CRUD tables/rows/columns).\n\n" +
      "**Доступ:** `requireProjectAccess` (владелец / collaborator).\n\n" +
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
      401: {
        description: "Нет session cookie и Bearer PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: { message: "Нет доступа к проекту" },
          },
        },
      },
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
