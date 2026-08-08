/**
 * @fileoverview OpenAPI: collaborators проекта `/api/bot/projects/{id}/…`.
 * @module server/swagger/paths/bot-api-collaborators-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  BotApiCollaboratorUserParamsSchema,
  BotApiCookiesSchema,
  BotApiProjectIdParamsSchema,
  BotApiSuccessSchema,
  BotApiTelegramIdQuerySchema,
} from "../schemas/bot-api";
import {
  BotApiAddCollaboratorBodySchema,
  BotApiCollaboratorListSchema,
} from "../schemas/bot-api-extra";
import { BOT_API_AUTH_DOC } from "./bot-api-auth-doc";
import { BOT_API_CRUD_ERRORS } from "./bot-api-responses";

/**
 * Регистрирует GET/POST/DELETE collaborators.
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiCollaboratorsPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const q = BotApiTelegramIdQuerySchema.partial();

  registry.registerPath({
    method: "get",
    path: "/api/bot/projects/{id}/collaborators",
    tags: ["bot"],
    summary: "Список коллабораторов проекта",
    description:
      BOT_API_AUTH_DOC +
      "**Клиент:** UI `use-collaborators`.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/projects/42/collaborators?telegram_id=123' \\\n" +
      "  -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: BotApiCookiesSchema, params: BotApiProjectIdParamsSchema, query: q },
    responses: {
      200: {
        description: "items + count",
        content: {
          "application/json": {
            schema: BotApiCollaboratorListSchema,
            example: {
              items: [{ projectId: 42, userId: 999, invitedBy: 123 }],
              count: 1,
            },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/bot/projects/{id}/collaborators",
    tags: ["bot"],
    summary: "Добавить коллаборатора",
    description:
      BOT_API_AUTH_DOC +
      "Body `{ user_id }`. **Клиент:** UI `use-collaborators`.\n\n" +
      "```bash\ncurl -s -X POST 'http://localhost:5000/api/bot/projects/42/collaborators?telegram_id=123' \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' -d '{\"user_id\":999}'\n```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      params: BotApiProjectIdParamsSchema,
      query: q,
      body: { content: { "application/json": { schema: BotApiAddCollaboratorBodySchema } } },
    },
    responses: {
      200: {
        description: "Добавлен",
        content: {
          "application/json": { schema: BotApiSuccessSchema, example: { success: true } },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/bot/projects/{id}/collaborators/{userId}",
    tags: ["bot"],
    summary: "Удалить коллаборатора",
    description:
      BOT_API_AUTH_DOC +
      "**Клиент:** UI `use-collaborators`.\n\n" +
      "```bash\ncurl -s -X DELETE \\\n" +
      "  'http://localhost:5000/api/bot/projects/42/collaborators/999?telegram_id=123' \\\n" +
      "  -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      params: BotApiCollaboratorUserParamsSchema,
      query: q,
    },
    responses: {
      200: {
        description: "Удалён",
        content: {
          "application/json": { schema: BotApiSuccessSchema, example: { success: true } },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });
}
