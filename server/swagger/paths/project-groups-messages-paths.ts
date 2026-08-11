/**
 * @fileoverview OpenAPI: GET …/groups/{groupId}/messages.
 * @module server/swagger/paths/project-groups-messages-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  GroupDialogMessageListSchema,
  ProjectGroupsGroupParamsSchema,
  ProjectGroupsMessagesQuerySchema,
} from "../schemas/project-groups";
import {
  PROJECT_GROUPS_FORBIDDEN_EXAMPLE,
  PROJECT_GROUPS_MESSAGES_EXAMPLE,
  PROJECT_GROUPS_NOT_FOUND_EXAMPLE,
} from "./project-groups-examples";

/**
 * Регистрирует историю сообщений группового диалога.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectGroupsMessagesPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/groups/{groupId}/messages",
    tags: ["project-groups"],
    summary: "История сообщений группы",
    description:
      "Лента группового диалога (хронологически). Группа должна относиться к проекту " +
      "(`bot_groups` или уже есть сообщения) — иначе 404. `tokenId` / `limit` (default 100).\n\n" +
      "**Клиент:** `dialog-panel` (режим группы).\n\n" +
      "```bash\ncurl -s -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/groups/-1001234567890/messages?limit=50'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectGroupsGroupParamsSchema,
      query: ProjectGroupsMessagesQuerySchema,
    },
    responses: {
      200: {
        description: "Массив сообщений (от старых к новым)",
        content: {
          "application/json": {
            schema: GroupDialogMessageListSchema,
            example: PROJECT_GROUPS_MESSAGES_EXAMPLE,
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
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_GROUPS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      404: {
        description: "Группа не привязана к проекту",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_GROUPS_NOT_FOUND_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось получить сообщения группы" },
          },
        },
      },
    },
  });
}
