/**
 * @fileoverview OpenAPI: GET/PATCH/DELETE `/api/bot/projects/{id}`.
 * @module server/swagger/paths/bot-api-project-crud-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  BotApiCookiesSchema,
  BotApiProjectDetailSchema,
  BotApiProjectIdParamsSchema,
  BotApiProjectUpdatedSchema,
  BotApiRenameProjectBodySchema,
  BotApiSuccessSchema,
  BotApiTelegramIdQuerySchema,
} from "../schemas/bot-api";
import { BOT_API_AUTH_DOC } from "./bot-api-auth-doc";
import { BOT_API_CRUD_ERRORS } from "./bot-api-responses";

/**
 * Регистрирует CRUD одного проекта.
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiProjectCrudPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const req = {
    cookies: BotApiCookiesSchema,
    params: BotApiProjectIdParamsSchema,
    query: BotApiTelegramIdQuerySchema.partial(),
  };

  registry.registerPath({
    method: "get",
    path: "/api/bot/projects/{id}",
    tags: ["bot"],
    summary: "Детали проекта (без data)",
    description:
      BOT_API_AUTH_DOC +
      "hasProjectAccess. **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/projects/42?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: req,
    responses: {
      200: {
        description: "Метаданные",
        content: {
          "application/json": {
            schema: BotApiProjectDetailSchema,
            example: { id: 42, name: "Мой бот", description: "" },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/bot/projects/{id}",
    tags: ["bot"],
    summary: "Переименовать проект",
    description:
      BOT_API_AUTH_DOC +
      "Body `{ name }`. **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s -X PATCH 'http://localhost:5000/api/bot/projects/42?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"name\":\"Новое имя\"}'\n```",
    security: cookieSecurity,
    request: {
      ...req,
      body: { content: { "application/json": { schema: BotApiRenameProjectBodySchema } } },
    },
    responses: {
      200: {
        description: "Обновлён",
        content: {
          "application/json": {
            schema: BotApiProjectUpdatedSchema,
            example: { id: 42, name: "Новое имя" },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/bot/projects/{id}",
    tags: ["bot"],
    summary: "Удалить проект",
    description:
      BOT_API_AUTH_DOC +
      "Владелец/collaborator. **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s -X DELETE 'http://localhost:5000/api/bot/projects/42?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: req,
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
