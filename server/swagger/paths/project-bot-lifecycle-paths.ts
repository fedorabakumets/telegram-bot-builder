/**
 * @fileoverview OpenAPI: POST start / stop.
 * @module server/swagger/paths/project-bot-lifecycle-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  ProjectBotIdParamsSchema,
  ProjectBotStartOkSchema,
  ProjectBotStopOkSchema,
  ProjectBotTokenBodySchema,
} from "../schemas/project-bot";
import {
  PROJECT_BOT_FORBIDDEN_EXAMPLE,
  PROJECT_BOT_START_OK_EXAMPLE,
} from "./project-bot-examples";

/**
 * Регистрирует start и stop одного бота.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBotLifecyclePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const authReq = {
    cookies: ProjectsCookiesSchema,
    headers: ProjectsAuthHeadersSchema,
    params: ProjectBotIdParamsSchema,
    body: {
      content: { "application/json": { schema: ProjectBotTokenBodySchema } },
    },
  };

  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/bot/start",
    tags: ["project-bot"],
    summary: "Запустить бота",
    description:
      "Старт по `tokenId` (или default). Сырой `token` не принимается. " +
      "**Клиент/MCP:** `use-bot-mutations`, `db_start_bot`.\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"tokenId\":7}' 'http://localhost:5000/api/projects/42/bot/start'\n```",
    security: cookieSecurity,
    request: authReq,
    responses: {
      200: {
        description: "Запущен",
        content: {
          "application/json": {
            schema: ProjectBotStartOkSchema,
            example: PROJECT_BOT_START_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Уже running / нет токена / сырой token",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Бот уже запущен" },
          },
        },
      },
      401: {
        description: "Нет session / PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа / чужой tokenId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_BOT_FORBIDDEN_EXAMPLE,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/bot/stop",
    tags: ["project-bot"],
    summary: "Остановить бота",
    description:
      "Остановка по обязательному `tokenId`. **Клиент/MCP:** `use-bot-mutations`, `db_stop_bot`.\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"tokenId\":7}' 'http://localhost:5000/api/projects/42/bot/stop'\n```",
    security: cookieSecurity,
    request: authReq,
    responses: {
      200: {
        description: "Остановлен",
        content: {
          "application/json": {
            schema: ProjectBotStopOkSchema,
            example: { message: "Бот успешно остановлен" },
          },
        },
      },
      400: {
        description: "Нет tokenId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Требуется ID токена" },
          },
        },
      },
      401: {
        description: "Нет session / PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа / чужой tokenId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Токен не принадлежит этому проекту" },
          },
        },
      },
    },
  });
}
