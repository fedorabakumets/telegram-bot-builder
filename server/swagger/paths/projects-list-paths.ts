/**
 * @fileoverview OpenAPI: GET /api/projects и GET /api/projects/list.
 * @module server/swagger/paths/projects-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  BotProjectListSchema,
  ProjectListSchema,
  ProjectsCookiesSchema,
} from "../schemas/projects";
import {
  BOT_PROJECT_EXAMPLE,
  PROJECT_LIST_ITEM_EXAMPLE,
  PROJECTS_ALL_ERROR_EXAMPLE,
  PROJECTS_LIST_ERROR_EXAMPLE,
} from "./projects-examples";

/**
 * Регистрирует лёгкий и полный списки проектов.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsListPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/list",
    tags: ["projects"],
    summary: "Лёгкий список проектов (без секретов и data)",
    description:
      "Метаданные проектов владельца и коллаборатора: id, name, sortOrder, " +
      "`nodeCount` / `sheetsCount`. **Без** `data`, `botToken`, `sessionId` " +
      "(whitelist DTO `toProjectListItem`).\n\n" +
      "**Параметры:** path/query/body нет. Auth — cookie `connect.sid` или Bearer PAT.\n\n" +
      "**Клиент:** `App`, home, `use-project-loader`, MCP `db_list_projects`.\n\n" +
      "Предпочтительнее тяжёлого `GET /api/projects` для списков в UI.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/projects/list -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: ProjectsCookiesSchema },
    responses: {
      200: {
        description: "Массив ProjectListItem (может быть пустым)",
        content: {
          "application/json": {
            schema: ProjectListSchema,
            examples: {
              withProjects: {
                summary: "Есть проекты",
                value: [PROJECT_LIST_ITEM_EXAMPLE],
              },
              empty: { summary: "Пустой список", value: [] },
            },
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
      500: {
        description: "Ошибка БД / маппинга",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECTS_LIST_ERROR_EXAMPLE,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects",
    tags: ["projects"],
    summary: "Полный список проектов (со сценарием data)",
    description:
      "Сырые записи `bot_projects` владельца/коллаборатора, **включая** `data` " +
      "(весь сценарий). Может содержать устаревшее поле `botToken`.\n\n" +
      "**Параметры:** path/query/body нет. Auth — cookie или Bearer PAT.\n\n" +
      "**Клиент:** сайдбар редактора (`use-projects-query`), canvas, bot-queries.\n\n" +
      "Для списков в UI предпочтительнее `GET /api/projects/list`; полный сценарий — " +
      "`GET /api/projects/{id}`.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/projects -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: ProjectsCookiesSchema },
    responses: {
      200: {
        description: "Массив полных BotProject",
        content: {
          "application/json": {
            schema: BotProjectListSchema,
            examples: {
              withProjects: {
                summary: "Есть проекты",
                value: [BOT_PROJECT_EXAMPLE],
              },
              empty: { summary: "Пустой список", value: [] },
            },
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
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECTS_ALL_ERROR_EXAMPLE,
          },
        },
      },
    },
  });
}
