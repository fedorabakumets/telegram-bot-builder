/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/bot/statuses
 * @module server/swagger/paths/project-bot-statuses-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { ForbiddenSchema, MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectBotIdParamsSchema } from "../schemas/project-bot";
import { ProjectBotStatusesResponseSchema } from "../schemas/bot-tokens";
import { PROJECT_BOT_FORBIDDEN_EXAMPLE } from "./project-bot-examples";

const STATUSES_OK_EXAMPLE = {
  statuses: [
    {
      tokenId: 7,
      status: "running",
      instance: {
        id: 1,
        projectId: 42,
        tokenId: 7,
        status: "running",
        processId: "worker_42",
        startedAt: "2026-08-18T13:42:04.555Z",
        stoppedAt: null,
        errorMessage: null,
      },
    },
    { tokenId: 8, status: "stopped", instance: null },
  ],
};

/**
 * Регистрирует список live-статусов ботов проекта.
 * @param registry - OpenAPI registry
 * @param cookieSecurity - Cookie / PAT
 * @returns void
 */
export function registerProjectBotStatusesPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/bot/statuses",
    tags: ["project-bot"],
    summary: "Статусы всех ботов проекта",
    description:
      "Один ответ вместо N запросов `GET /api/tokens/{tokenId}/bot-status`. " +
      "Сверка с worker pool / in-memory процессом. `instance` без сырого token. " +
      "`Cache-Control: no-store`.\n\n" +
      "**Auth:** `requireProjectAccess` — только свои/коллабораторские проекты " +
      "(не IDOR по чужим tokenId).\n\n" +
      "Одиночный статус: `GET /api/tokens/{tokenId}/bot-status` " +
      "(MCP: `db_bot_status`).\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/projects/42/bot/statuses -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBotIdParamsSchema,
    },
    responses: {
      200: {
        description: "Статусы токенов проекта",
        content: {
          "application/json": {
            schema: ProjectBotStatusesResponseSchema,
            example: STATUSES_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Неверный ID проекта",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверный ID проекта" },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: PROJECT_BOT_FORBIDDEN_EXAMPLE,
          },
        },
      },
    },
  });
}
