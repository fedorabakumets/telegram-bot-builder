/**
 * @fileoverview OpenAPI: DELETE /api/agent-tokens/{id}.
 * @module server/swagger/paths/agent-token-revoke-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  AgentTokenErrorSchema,
  AgentTokenIdParamsSchema,
  AgentTokensCookiesSchema,
  RevokeAgentTokenResponseSchema,
} from "../schemas/agent-tokens";
import {
  AGENT_TOKEN_NOT_FOUND_EXAMPLE,
  AGENT_TOKEN_UNAUTHORIZED_EXAMPLE,
  REVOKE_AGENT_TOKEN_OK_EXAMPLE,
} from "./agent-token-examples";

/**
 * Регистрирует отзыв PAT.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerAgentTokenRevokePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/agent-tokens/{id}",
    tags: ["agent-tokens"],
    summary: "Отозвать токен агента",
    description:
      "Отзывает только токен **текущего** пользователя (`ownerId`). Чужой / несуществующий → 404.\n\n" +
      "**Path:** `id` — числовой ID записи в `agent_tokens` (из списка GET).\n\n" +
      "```bash\n" +
      "curl -s -X DELETE http://localhost:5000/api/agent-tokens/1 -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: AgentTokensCookiesSchema,
      params: AgentTokenIdParamsSchema,
    },
    responses: {
      200: {
        description: "Токен отозван",
        content: {
          "application/json": {
            schema: RevokeAgentTokenResponseSchema,
            example: REVOKE_AGENT_TOKEN_OK_EXAMPLE,
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: {
          "application/json": {
            schema: AgentTokenErrorSchema,
            example: AGENT_TOKEN_UNAUTHORIZED_EXAMPLE,
          },
        },
      },
      404: {
        description: "Токен не найден или чужой",
        content: {
          "application/json": {
            schema: AgentTokenErrorSchema,
            example: AGENT_TOKEN_NOT_FOUND_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: AgentTokenErrorSchema,
            example: { error: "Не удалось отозвать токен агента" },
          },
        },
      },
    },
  });
}
