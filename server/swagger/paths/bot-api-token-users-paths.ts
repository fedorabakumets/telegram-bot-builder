/**
 * @fileoverview OpenAPI: пользователи токена `/api/bot/tokens/{tokenId}/users`.
 * @module server/swagger/paths/bot-api-token-users-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  BotApiCookiesSchema,
  BotApiTelegramIdQuerySchema,
  BotApiTokenIdParamsSchema,
} from "../schemas/bot-api";
import {
  BotApiBotUserDetailSchema,
  BotApiBotUserListSchema,
  BotApiTokenUserParamsSchema,
  BotApiUsersQuerySchema,
} from "../schemas/bot-api-runtime";
import { BOT_API_AUTH_DOC } from "./bot-api-auth-doc";
import { BOT_API_CRUD_ERRORS } from "./bot-api-responses";

/**
 * Регистрирует GET users и GET users/{userId}.
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiTokenUsersPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/bot/tokens/{tokenId}/users",
    tags: ["bot"],
    summary: "Список пользователей бота",
    description:
      BOT_API_AUTH_DOC +
      "Пагинация `limit` (≤50) / `offset`. **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/tokens/7/users?telegram_id=123&limit=10&offset=0' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      params: BotApiTokenIdParamsSchema,
      query: BotApiUsersQuerySchema,
    },
    responses: {
      200: {
        description: "items + count + offsets",
        content: {
          "application/json": {
            schema: BotApiBotUserListSchema,
            example: {
              items: [{ userId: "161", firstName: "Ada", userName: "ada" }],
              count: 1,
              nextOffset: null,
              prevOffset: null,
              fromItem: 1,
              toItem: 1,
            },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/bot/tokens/{tokenId}/users/{userId}",
    tags: ["bot"],
    summary: "Один пользователь бота + аватар",
    description:
      BOT_API_AUTH_DOC +
      "Даты в ответе отформатированы. **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/tokens/7/users/161?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      params: BotApiTokenUserParamsSchema,
      query: BotApiTelegramIdQuerySchema.partial(),
    },
    responses: {
      200: {
        description: "Пользователь",
        content: {
          "application/json": {
            schema: BotApiBotUserDetailSchema,
            example: {
              userId: "161",
              firstName: "Ada",
              registeredAt: "09.08.2026 12:00",
              photoUrl: "/uploads/42/user_photos/user_161.jpg",
            },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });
}
