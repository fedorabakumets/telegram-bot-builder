/**
 * @fileoverview OpenAPI: PATCH/DELETE `/api/bot/env/{id}`.
 * @module server/swagger/paths/bot-api-env-id-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  BotApiCookiesSchema,
  BotApiEnvIdParamsSchema,
  BotApiErrorSchema,
  BotApiSuccessSchema,
  BotApiTelegramIdQuerySchema,
} from "../schemas/bot-api";
import {
  BotApiEnvVariableSchema,
  BotApiUpdateEnvBodySchema,
} from "../schemas/bot-api-extra";
import { BOT_API_AUTH_DOC } from "./bot-api-auth-doc";
import { BOT_API_CRUD_ERRORS } from "./bot-api-responses";

/**
 * Регистрирует обновление и удаление env по id.
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiEnvIdPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const q = BotApiTelegramIdQuerySchema.partial();

  registry.registerPath({
    method: "patch",
    path: "/api/bot/env/{id}",
    tags: ["bot"],
    summary: "Обновить env-переменную",
    description:
      BOT_API_AUTH_DOC +
      "Body `{ key?, value?, isSecret? }`. **Клиент:** unused.\n\n" +
      "```bash\ncurl -s -X PATCH 'http://localhost:5000/api/bot/env/15?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"value\":\"new\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      params: BotApiEnvIdParamsSchema,
      query: q,
      body: { content: { "application/json": { schema: BotApiUpdateEnvBodySchema } } },
    },
    responses: {
      200: {
        description: "Обновлена",
        content: { "application/json": { schema: BotApiEnvVariableSchema } },
      },
      409: {
        description: "Конфликт ключа",
        content: { "application/json": { schema: BotApiErrorSchema } },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/bot/env/{id}",
    tags: ["bot"],
    summary: "Удалить env-переменную",
    description:
      BOT_API_AUTH_DOC +
      "**Клиент:** unused.\n\n" +
      "```bash\ncurl -s -X DELETE 'http://localhost:5000/api/bot/env/15?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: { cookies: BotApiCookiesSchema, params: BotApiEnvIdParamsSchema, query: q },
    responses: {
      200: {
        description: "Удалена",
        content: {
          "application/json": { schema: BotApiSuccessSchema, example: { success: true } },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });
}
