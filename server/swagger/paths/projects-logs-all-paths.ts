/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/logs/all.
 * @module server/swagger/paths/projects-logs-all-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  ProjectLogsAllQuerySchema,
  ProjectSystemLogListSchema,
  SystemTablesProjectIdParamsSchema,
} from "../schemas/project-system-tables";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";

/** Пример системной таблицы логов */
const LOGS_ALL_EXAMPLE = [
  {
    level: "stdout",
    message: "Bot started successfully",
    createdAt: "2026-08-08T20:00:00.000Z",
  },
  {
    level: "stderr",
    message: "Warning: deprecated handler",
    createdAt: "2026-08-08T19:59:50.000Z",
  },
];

/**
 * Регистрирует системные логи проекта (таблица Database → Логи).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsLogsAllPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/logs/all",
    tags: ["projects"],
    summary: "Системные логи бота проекта",
    description:
      "Укороченные строки `bot_logs`: `level` (= type), `message` (до 150 " +
      "символов content), `createdAt` (= timestamp). Сортировка DESC.\n\n" +
      "**Query:** `limit` (default 200), опционально `tokenId`.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** системная таблица «Логи» (`use-system-tables`).\n\n" +
      "При ошибке БД хендлер отвечает **200** с `[]` (не 500).\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/logs/all?limit=200&tokenId=7' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: SystemTablesProjectIdParamsSchema,
      query: ProjectLogsAllQuerySchema,
    },
    responses: {
      200: {
        description: "Массив логов (или [] при ошибке БД)",
        content: {
          "application/json": {
            schema: ProjectSystemLogListSchema,
            examples: {
              withLogs: { summary: "Есть логи", value: LOGS_ALL_EXAMPLE },
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
