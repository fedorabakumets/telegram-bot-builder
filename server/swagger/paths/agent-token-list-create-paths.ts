/**
 * @fileoverview OpenAPI: GET/POST /api/agent-tokens.
 * @module server/swagger/paths/agent-token-list-create-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  AgentTokenErrorSchema,
  AgentTokenListSchema,
  AgentTokensCookiesSchema,
  CreateAgentTokenRequestSchema,
  CreateAgentTokenResponseSchema,
  CreateAgentTokenValidationErrorSchema,
} from "../schemas/agent-tokens";
import {
  AGENT_TOKEN_LIST_EXAMPLE,
  AGENT_TOKEN_UNAUTHORIZED_EXAMPLE,
  CREATE_AGENT_TOKEN_BODY_EXAMPLE,
  CREATE_AGENT_TOKEN_OK_EXAMPLE,
} from "./agent-token-examples";

/**
 * Регистрирует list + create PAT.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerAgentTokenListCreatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/agent-tokens",
    tags: ["agent-tokens"],
    summary: "Список токенов агента",
    description:
      "PAT текущего пользователя **без секрета** (только `prefix` и метаданные).\n\n" +
      "**Авторизация:** session cookie `connect.sid` или Bearer PAT.\n" +
      "Секрет полного токена сюда **не** возвращается.\n\n" +
      "**Клиент / MCP:** настройки агента, список ключей.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/agent-tokens -b cookies.txt\n" +
      "# или\n" +
      "curl -s http://localhost:5000/api/agent-tokens \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n" +
      "```",
    security: cookieSecurity,
    request: { cookies: AgentTokensCookiesSchema },
    responses: {
      200: {
        description: "Массив токенов владельца",
        content: {
          "application/json": {
            schema: AgentTokenListSchema,
            example: AGENT_TOKEN_LIST_EXAMPLE,
          },
        },
      },
      401: {
        description: "Нет session cookie и Bearer PAT",
        content: {
          "application/json": {
            schema: AgentTokenErrorSchema,
            example: AGENT_TOKEN_UNAUTHORIZED_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: AgentTokenErrorSchema,
            example: { error: "Не удалось получить токены агента" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/agent-tokens",
    tags: ["agent-tokens"],
    summary: "Создать токен агента",
    description:
      "Создаёт PAT. Поле `token` (полный секрет `mcp_…`) возвращается **один раз** — сохраните сразу.\n\n" +
      "**Тело:** `label` (обязательно), `scopes` (`read` | `read,write` | `read,write,bot_manager`, " +
      "по умолчанию `read,write`; `bot_manager` — для Bot Manager / `/api/bot`), " +
      "`expiresInDays` (опционально, иначе бессрочный).\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/agent-tokens -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"label\":\"Cursor MCP\",\"scopes\":\"read,write\",\"expiresInDays\":90}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: AgentTokensCookiesSchema,
      body: {
        required: true,
        content: {
          "application/json": {
            schema: CreateAgentTokenRequestSchema,
            example: CREATE_AGENT_TOKEN_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Токен создан; секрет в `token`",
        content: {
          "application/json": {
            schema: CreateAgentTokenResponseSchema,
            example: CREATE_AGENT_TOKEN_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Ошибка валидации Zod",
        content: {
          "application/json": {
            schema: CreateAgentTokenValidationErrorSchema,
            example: {
              error: "Некорректные данные",
              details: [{ path: ["label"], message: "Название обязательно" }],
            },
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
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: AgentTokenErrorSchema,
            example: { error: "Не удалось создать токен агента" },
          },
        },
      },
    },
  });
}
