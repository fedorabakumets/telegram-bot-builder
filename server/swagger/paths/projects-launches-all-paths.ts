/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/launches/all.
 * @module server/swagger/paths/projects-launches-all-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  ProjectSystemLaunchListSchema,
  SystemTablesProjectIdParamsSchema,
} from "../schemas/project-system-tables";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";

/** Пример истории запусков */
const LAUNCHES_ALL_EXAMPLE = [
  {
    status: "stopped",
    startedAt: "2026-08-08T19:55:00.000Z",
    stoppedAt: "2026-08-08T20:10:00.000Z",
    errorMessage: null,
  },
  {
    status: "error",
    startedAt: "2026-08-07T12:00:00.000Z",
    stoppedAt: "2026-08-07T12:01:00.000Z",
    errorMessage: "Token revoked",
  },
];

/**
 * Регистрирует историю запусков проекта (таблица Database → Запуски).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsLaunchesAllPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/launches/all",
    tags: ["projects"],
    summary: "История запусков ботов проекта",
    description:
      "До 100 записей `bot_launch_history` по всем токенам проекта: " +
      "`status`, `startedAt`, `stoppedAt`, `errorMessage` (до 100 символов). " +
      "Сортировка по `started_at` DESC.\n\n" +
      "**Параметры:** path `id`. Query `tokenId` UI может слать, хендлер его " +
      "не фильтрует.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** системная таблица «Запуски» (`use-system-tables`).\n\n" +
      "При ошибке БД — **200** с `[]`.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/projects/42/launches/all -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: SystemTablesProjectIdParamsSchema,
    },
    responses: {
      200: {
        description: "Массив запусков (или [] при ошибке БД)",
        content: {
          "application/json": {
            schema: ProjectSystemLaunchListSchema,
            examples: {
              withLaunches: {
                summary: "Есть запуски",
                value: LAUNCHES_ALL_EXAMPLE,
              },
              empty: { summary: "Пусто / ошибка БД", value: [] },
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
      403: {
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Нет прав доступа к проекту" },
          },
        },
      },
    },
  });
}
