/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/tokens/first.
 * @module server/swagger/paths/project-tokens-first-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectTokensIdParamsSchema } from "../schemas/project-tokens-params";
import { TokensFirstResponseSchema } from "../schemas/project-tokens-dto";
import { TOKENS_FIRST_EXAMPLE } from "./project-tokens-examples";

/**
 * Регистрирует GET tokens/first (сырой секрет + id).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensFirstPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/tokens/first",
    tags: ["project-tokens"],
    summary: "Дефолтный токен для codegen (.env)",
    description:
      "Дефолтный токен проекта (`getDefaultBotToken`, иначе любой). " +
      "Ответ: `{ hasToken, id, token }` — **сырой** Telegram token + id.\n\n" +
      "**Риск:** не логировать тело. `Cache-Control: no-store`.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** `use-code-generator` (BOT_TOKEN + env-variables по `id`).\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/projects/42/tokens/first -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectTokensIdParamsSchema,
    },
    responses: {
      200: {
        description: "Сырой token + id, или hasToken=false",
        content: {
          "application/json": {
            schema: TokensFirstResponseSchema,
            examples: {
              withToken: { summary: "Есть токен", value: TOKENS_FIRST_EXAMPLE },
              empty: {
                summary: "Нет токенов",
                value: { hasToken: false, id: null, token: null },
              },
            },
          },
        },
      },
      400: {
        description: "Невалидный id проекта",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Некорректный projectId" },
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
            example: { message: "Нет прав доступа к проекту" },
          },
        },
      },
    },
  });
}
