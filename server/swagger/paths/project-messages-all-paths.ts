/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/messages/all.
 * @module server/swagger/paths/project-messages-all-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectMessageListSchema } from "../schemas/project-messages-dto";
import {
  ProjectMessagesAllQuerySchema,
  ProjectMessagesProjectIdParamsSchema,
} from "../schemas/project-messages-params";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  PROJECT_MESSAGES_ALL_EXAMPLE,
  PROJECT_MESSAGES_FORBIDDEN_EXAMPLE,
} from "./project-messages-examples";

/**
 * Регистрирует список всех сообщений проекта (системная таблица).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectMessagesAllPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/messages/all",
    tags: ["project-messages"],
    summary: "Все сообщения проекта (усечённый список)",
    description:
      "Выборка из `bot_messages`: id, userId, messageType, messageText " +
      "(SUBSTRING 100), chatType, chatId, createdAt. " +
      "Сортировка `created_at DESC`. Default limit=200, offset=0.\n\n" +
      "**Auth:** `requireApiAuth` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `use-system-tables`.\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/messages/all?limit=50&tokenId=7' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectMessagesProjectIdParamsSchema,
      query: ProjectMessagesAllQuerySchema,
    },
    responses: {
      200: {
        description: "Массив сообщений",
        content: {
          "application/json": {
            schema: ProjectMessageListSchema,
            example: PROJECT_MESSAGES_ALL_EXAMPLE,
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
            example: PROJECT_MESSAGES_FORBIDDEN_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Ошибка при получении сообщений" },
          },
        },
      },
    },
  });
}
