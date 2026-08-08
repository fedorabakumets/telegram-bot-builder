/**
 * @fileoverview OpenAPI: GET/POST `/api/bot/tokens/{tokenId}/env`.
 * @module server/swagger/paths/bot-api-token-env-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  BotApiCookiesSchema,
  BotApiErrorSchema,
  BotApiTelegramIdQuerySchema,
  BotApiTokenIdParamsSchema,
} from "../schemas/bot-api";
import {
  BotApiCreateEnvBodySchema,
  BotApiEnvListSchema,
  BotApiEnvVariableSchema,
} from "../schemas/bot-api-extra";
import { BOT_API_AUTH_DOC } from "./bot-api-auth-doc";
import { BOT_API_CRUD_ERRORS } from "./bot-api-responses";

/**
 * Регистрирует список и создание env токена.
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiTokenEnvPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const q = BotApiTelegramIdQuerySchema.partial();

  registry.registerPath({
    method: "get",
    path: "/api/bot/tokens/{tokenId}/env",
    tags: ["bot"],
    summary: "Список env токена (секреты маскируются)",
    description:
      BOT_API_AUTH_DOC +
      "UI — `/api/projects/…/env-variables`. **Клиент:** unused.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/tokens/7/env?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: { cookies: BotApiCookiesSchema, params: BotApiTokenIdParamsSchema, query: q },
    responses: {
      200: {
        description: "items + count",
        content: {
          "application/json": {
            schema: BotApiEnvListSchema,
            example: {
              items: [{ id: 15, tokenId: 7, key: "API_KEY", value: "••••••••", isSecret: 1 }],
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
    path: "/api/bot/tokens/{tokenId}/env",
    tags: ["bot"],
    summary: "Создать env-переменную",
    description:
      BOT_API_AUTH_DOC +
      "Body `{ key, value?, isSecret? }`, ключ `^[A-Z][A-Z0-9_]*$`. **Клиент:** unused.\n\n" +
      "```bash\ncurl -s -X POST 'http://localhost:5000/api/bot/tokens/7/env?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"key\":\"API_KEY\",\"value\":\"secret\",\"isSecret\":1}'\n```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      params: BotApiTokenIdParamsSchema,
      query: q,
      body: { content: { "application/json": { schema: BotApiCreateEnvBodySchema } } },
    },
    responses: {
      201: {
        description: "Создана",
        content: {
          "application/json": {
            schema: BotApiEnvVariableSchema,
            example: { id: 15, tokenId: 7, key: "API_KEY", value: "secret", isSecret: 1 },
          },
        },
      },
      409: {
        description: "Ключ уже есть",
        content: { "application/json": { schema: BotApiErrorSchema } },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });
}
