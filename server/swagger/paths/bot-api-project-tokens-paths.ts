/**
 * @fileoverview OpenAPI: токены проекта и DELETE токена.
 * @module server/swagger/paths/bot-api-project-tokens-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  BotApiCookiesSchema,
  BotApiProjectIdParamsSchema,
  BotApiSuccessSchema,
  BotApiTelegramIdQuerySchema,
  BotApiTokenIdParamsSchema,
} from "../schemas/bot-api";
import {
  BotApiCreateTokenBodySchema,
  BotApiTokenCreatedSchema,
  BotApiTokenListSchema,
} from "../schemas/bot-api-extra";
import { BOT_API_AUTH_DOC } from "./bot-api-auth-doc";
import { BOT_API_CRUD_ERRORS } from "./bot-api-responses";

/**
 * Регистрирует GET/POST …/tokens и DELETE /tokens/{tokenId}.
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiProjectTokensPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const q = BotApiTelegramIdQuerySchema.partial();

  registry.registerPath({
    method: "get",
    path: "/api/bot/projects/{id}/tokens",
    tags: ["bot"],
    summary: "Список токенов проекта",
    description:
      BOT_API_AUTH_DOC +
      "**Риск:** ответ может содержать поле `token` (секрет). **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/projects/42/tokens?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: { cookies: BotApiCookiesSchema, params: BotApiProjectIdParamsSchema, query: q },
    responses: {
      200: {
        description: "items + count",
        content: {
          "application/json": {
            schema: BotApiTokenListSchema,
            example: { items: [{ id: 7, name: "@my_bot", botStatus: "🟢" }], count: 1 },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/bot/projects/{id}/tokens",
    tags: ["bot"],
    summary: "Добавить токен в проект",
    description:
      BOT_API_AUTH_DOC +
      "Body `{ token, name? }`. Валидация getMe; дубликат → существующий. **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s -X POST 'http://localhost:5000/api/bot/projects/42/tokens?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"token\":\"123:ABC…\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      params: BotApiProjectIdParamsSchema,
      query: q,
      body: { content: { "application/json": { schema: BotApiCreateTokenBodySchema } } },
    },
    responses: {
      200: {
        description: "Создан или уже существовал",
        content: {
          "application/json": {
            schema: BotApiTokenCreatedSchema,
            example: { id: 7, name: "@my_bot", projectId: 42 },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/bot/tokens/{tokenId}",
    tags: ["bot"],
    summary: "Удалить токен",
    description:
      BOT_API_AUTH_DOC +
      "hasProjectAccess к проекту токена. **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s -X DELETE 'http://localhost:5000/api/bot/tokens/7?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: { cookies: BotApiCookiesSchema, params: BotApiTokenIdParamsSchema, query: q },
    responses: {
      200: {
        description: "Удалено",
        content: {
          "application/json": { schema: BotApiSuccessSchema, example: { success: true } },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });
}
