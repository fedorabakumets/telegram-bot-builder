/**
 * @fileoverview OpenAPI: DELETE /api/projects/{projectId}/users/{userId}.
 * @module server/swagger/paths/bot-users-delete-one-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { DeleteBotUserSuccessSchema } from "../schemas/bot-users";
import {
  BotUsersItemParamsSchema,
  BotUsersTokenQuerySchema,
} from "../schemas/bot-users-params";
import { ProjectsCookiesSchema } from "../schemas/projects";
import {
  BOT_USERS_FORBIDDEN_EXAMPLE,
  BOT_USER_DELETE_OK_EXAMPLE,
} from "./bot-users-examples";

/**
 * Регистрирует удаление одного пользователя бота.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotUsersDeleteOnePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/projects/{projectId}/users/{userId}",
    tags: ["project-users"],
    summary: "Удалить одного пользователя и его сообщения",
    description:
      "**UI:** удаление пользователя в редакторе.\n\n" +
      "Удаляет `bot_messages` и строку `bot_users` для (user_id, project_id, token_id).\n\n" +
      "Не путать с `DELETE /api/projects/{id}/users` — wipe всех пользователей.\n\n" +
      "```bash\n" +
      "curl -s -X DELETE 'http://localhost:5000/api/projects/42/users/123456789?tokenId=7' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: BotUsersItemParamsSchema,
      query: BotUsersTokenQuerySchema,
    },
    responses: {
      200: {
        description: "Успешное удаление",
        content: {
          "application/json": {
            schema: DeleteBotUserSuccessSchema,
            example: BOT_USER_DELETE_OK_EXAMPLE,
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
            example: BOT_USERS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      404: {
        description: "Пользователь не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      503: {
        description: "Сервис не настроен (setupGuard)",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });
}
