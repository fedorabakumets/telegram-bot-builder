/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/tokens/first.
 * @module server/swagger/paths/project-tokens-first-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import { ProjectTokensIdParamsSchema } from "../schemas/project-tokens-params";
import { TokensFirstResponseSchema } from "../schemas/project-tokens-dto";
import { TOKENS_FIRST_EXAMPLE } from "./project-tokens-examples";

/**
 * Регистрирует GET tokens/first (сырой секрет).
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
    summary: "Первый токен — RAW SECRET (codegen)",
    description:
      "**Риск:** `{ hasToken, token }` — сырой Telegram token **без id**. " +
      "Для генерации `.env`/codegen UI. Не логировать ответ. " +
      "Предпочитайте `/tokens/list` + отдельный reveal, если нужен id.\n\n" +
      "**Auth:** опционально `getOwnerIdFromRequest` + `hasProjectAccess` при сессии.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/projects/42/tokens/first -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensIdParamsSchema,
    },
    responses: {
      200: {
        description: "Сырой token или hasToken=false",
        content: {
          "application/json": {
            schema: TokensFirstResponseSchema,
            examples: {
              withToken: { summary: "Есть токен", value: TOKENS_FIRST_EXAMPLE },
              empty: {
                summary: "Нет токенов",
                value: { hasToken: false, token: null },
              },
            },
          },
        },
      },
      403: {
        description: "Нет доступа (при auth)",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      404: {
        description: "Проект не найден (при auth)",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });
}
