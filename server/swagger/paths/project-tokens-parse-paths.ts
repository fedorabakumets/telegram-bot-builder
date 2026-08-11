/**
 * @fileoverview OpenAPI: POST /api/projects/{id}/tokens/parse.
 * @module server/swagger/paths/project-tokens-parse-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectTokensIdParamsSchema } from "../schemas/project-tokens-params";
import {
  ParseTokenErrorSchema,
  ParseTokenRequestSchema,
  ParseTokenResponseSchema,
} from "../schemas/project-tokens-parse";
import { PARSE_TOKEN_EXAMPLE } from "./project-tokens-examples";

/**
 * Регистрирует parse bot info через Telegram API.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT (глобальный auth)
 * @returns void
 */
export function registerProjectTokensParsePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/tokens/parse",
    tags: ["project-tokens"],
    summary: "Распарсить bot token через Telegram getMe",
    description:
      "Body `{ token }`. Вызывает `getMe`, `getMyDescription`, `getMyShortDescription`, " +
      "опционально фото. **Нет** middleware `requireProjectAccess` / ownership — " +
      "только глобальный `requireApiAuth` (если включён). `:id` в URL не влияет на Telegram.\n\n" +
      "**Клиент:** форма добавления токена (превью @username).\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/tokens/parse -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"token\":\"7123…:AAH…\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensIdParamsSchema,
      body: {
        content: {
          "application/json": { schema: ParseTokenRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Поля бота для формы",
        content: {
          "application/json": {
            schema: ParseTokenResponseSchema,
            example: PARSE_TOKEN_EXAMPLE,
          },
        },
      },
      400: {
        description: "Нет token / Invalid bot token",
        content: {
          "application/json": {
            schema: ParseTokenErrorSchema,
            example: {
              message: "Invalid bot token or failed to get bot info",
              error: "Unauthorized",
            },
          },
        },
      },
      500: {
        description: "Сеть / Telegram недоступен",
        content: {
          "application/json": {
            schema: ParseTokenErrorSchema,
            example: {
              message: "Failed to connect to Telegram API",
              details: "Set TELEGRAM_PROXY_URL in .env file.",
            },
          },
        },
      },
    },
  });
}
