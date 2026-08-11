/**
 * @fileoverview OpenAPI: PUT /api/projects/{projectId}/users/{userId}.
 * @module server/swagger/paths/bot-users-put-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import {
  BotUserRowSchema,
  UpdateBotUserRequestSchema,
} from "../schemas/bot-users";
import {
  BotUsersItemParamsSchema,
  BotUsersTokenQuerySchema,
} from "../schemas/bot-users-params";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  BOT_USERS_FORBIDDEN_EXAMPLE,
  BOT_USER_PUT_ACTIVATE_EXAMPLE,
  BOT_USER_PUT_DEACTIVATE_EXAMPLE,
  BOT_USER_ROW_EXAMPLE,
} from "./bot-users-examples";

/**
 * Регистрирует обновление одного пользователя бота.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotUsersPutPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/users/{userId}",
    tags: ["project-users"],
    summary: "Обновить статус активности пользователя",
    description:
      "**UI:** активен / неактивен в базе пользователей.\n\n" +
      "Обновляет `is_active` и `last_interaction`. `tokenId` — в query. " +
      "Токен через `resolveEffectiveProjectTokenId`.\n\n" +
      "```bash\n" +
      "curl -s -X PUT 'http://localhost:5000/api/projects/42/users/123456789?tokenId=7' \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' -d '{\"isActive\":1}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: BotUsersItemParamsSchema,
      query: BotUsersTokenQuerySchema,
      body: {
        required: true,
        content: {
          "application/json": {
            schema: UpdateBotUserRequestSchema,
            examples: {
              activate: { summary: "Активировать", value: BOT_USER_PUT_ACTIVATE_EXAMPLE },
              deactivate: {
                summary: "Деактивировать",
                value: BOT_USER_PUT_DEACTIVATE_EXAMPLE,
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Обновлённая строка bot_users",
        content: {
          "application/json": {
            schema: BotUserRowSchema,
            example: BOT_USER_ROW_EXAMPLE,
          },
        },
      },
      400: {
        description: "Нет полей для обновления",
        content: { "application/json": { schema: MessageErrorSchema } },
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
