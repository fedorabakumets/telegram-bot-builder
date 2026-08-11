/**
 * @fileoverview OpenAPI: POST …/bot/send-group-message.
 * @module server/swagger/paths/project-groups-send-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { SendDialogMessageErrorSchema } from "../schemas/project-user-dialog";
import {
  ProjectGroupsProjectIdParamsSchema,
  ProjectGroupsTokenQuerySchema,
  SendGroupMessageRequestSchema,
  SendGroupMessageResponseSchema,
} from "../schemas/project-groups";
import {
  PROJECT_GROUPS_FORBIDDEN_EXAMPLE,
  PROJECT_GROUPS_NOT_FOUND_EXAMPLE,
  SEND_GROUP_MESSAGE_BODY_EXAMPLE,
  SEND_GROUP_MESSAGE_OK_EXAMPLE,
} from "./project-groups-examples";

/**
 * Регистрирует отправку сообщения в группу из Studio.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectGroupsSendPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/bot/send-group-message",
    tags: ["project-groups"],
    summary: "Отправить сообщение в группу",
    description:
      "Текст / медиа / кнопки в группу из панели диалогов. `groupId` в теле — chat_id; " +
      "группа должна относиться к проекту. Пишется в историю + WS `new-message`. " +
      "`tokenId` — от какого бота слать.\n\n" +
      "**Клиент:** `use-send-group-message`.\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"groupId\":\"-1001234567890\",\"message\":\"Здравствуйте!\"}' \\\n" +
      "  'http://localhost:5000/api/projects/42/bot/send-group-message?tokenId=7'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectGroupsProjectIdParamsSchema,
      query: ProjectGroupsTokenQuerySchema,
      body: {
        content: {
          "application/json": {
            schema: SendGroupMessageRequestSchema,
            example: SEND_GROUP_MESSAGE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Отправлено и сохранено",
        content: {
          "application/json": {
            schema: SendGroupMessageResponseSchema,
            example: SEND_GROUP_MESSAGE_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Нет токена / пустое тело / Telegram отклонил",
        content: {
          "application/json": {
            schema: SendDialogMessageErrorSchema,
            example: { message: "Требуется ID группы и сообщение" },
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
    },
  });
}
