/**
 * @fileoverview OpenAPI paths для /api/agent-tokens
 * @module server/swagger/paths/agent-token-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  AgentTokenErrorSchema,
  AgentTokenListSchema,
  CreateAgentTokenRequestSchema,
  CreateAgentTokenResponseSchema,
  CreateAgentTokenValidationErrorSchema,
  RevokeAgentTokenResponseSchema,
} from "../schemas/agent-tokens";

/**
 * Регистрирует детальные OpenAPI paths управления PAT.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security requirement для session cookie
 * @returns void
 */
export function registerAgentTokenPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/agent-tokens",
    tags: ["agent-tokens"],
    summary: "Список токенов агента",
    description:
      "Требует session cookie. Возвращает PAT текущего пользователя без секрета (только prefix и метаданные).",
    security: cookieSecurity,
    responses: {
      200: {
        description: "Массив токенов владельца",
        content: { "application/json": { schema: AgentTokenListSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: AgentTokenErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/agent-tokens",
    tags: ["agent-tokens"],
    summary: "Создать токен агента",
    description:
      "Требует session cookie. Полный секрет `token` возвращается один раз — сохраните сразу.",
    security: cookieSecurity,
    request: {
      body: { content: { "application/json": { schema: CreateAgentTokenRequestSchema } } },
    },
    responses: {
      201: {
        description: "Токен создан",
        content: { "application/json": { schema: CreateAgentTokenResponseSchema } },
      },
      400: {
        description: "Ошибка валидации",
        content: { "application/json": { schema: CreateAgentTokenValidationErrorSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: AgentTokenErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/agent-tokens/{id}",
    tags: ["agent-tokens"],
    summary: "Отозвать токен агента",
    description: "Требует session cookie. Отзывает только токен текущего пользователя.",
    security: cookieSecurity,
    request: {
      params: z.object({
        /** ID записи токена */
        id: z.string().openapi({ example: "1", description: "ID токена в БД" }),
      }),
    },
    responses: {
      200: {
        description: "Токен отозван",
        content: { "application/json": { schema: RevokeAgentTokenResponseSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: AgentTokenErrorSchema } },
      },
      404: {
        description: "Токен не найден или чужой",
        content: { "application/json": { schema: AgentTokenErrorSchema } },
      },
    },
  });
}
