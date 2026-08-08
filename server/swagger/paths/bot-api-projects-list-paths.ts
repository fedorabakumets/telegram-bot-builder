/**
 * @fileoverview OpenAPI: list/create/import `/api/bot/projects`.
 * @module server/swagger/paths/bot-api-projects-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  BotApiCookiesSchema,
  BotApiCreateProjectBodySchema,
  BotApiErrorSchema,
  BotApiProjectCreatedSchema,
  BotApiProjectListSchema,
  BotApiTelegramIdQuerySchema,
} from "../schemas/bot-api";
import { BOT_API_AUTH_DOC } from "./bot-api-auth-doc";
import { BOT_API_AUTH_ERRORS, BOT_API_BAD_AUTH_ERRORS } from "./bot-api-responses";

/**
 * Регистрирует GET/POST /projects и POST /import.
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiProjectsListPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const q = BotApiTelegramIdQuerySchema.partial();
  const base = { cookies: BotApiCookiesSchema, query: q };

  registry.registerPath({
    method: "get",
    path: "/api/bot/projects",
    tags: ["bot"],
    summary: "Список проектов актора",
    description:
      BOT_API_AUTH_DOC +
      "Safe DTO без data/token. **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/projects?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: base,
    responses: {
      200: {
        description: "items + count",
        content: {
          "application/json": {
            schema: BotApiProjectListSchema,
            example: { items: [{ id: 42, name: "Мой бот", description: "" }], count: 1 },
          },
        },
      },
      ...BOT_API_BAD_AUTH_ERRORS,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/bot/projects",
    tags: ["bot"],
    summary: "Создать пустой проект",
    description:
      BOT_API_AUTH_DOC +
      "Body `{ name? }` (дефолт «Новый проект»). **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s -X POST 'http://localhost:5000/api/bot/projects?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"name\":\"Новый бот\"}'\n```",
    security: cookieSecurity,
    request: {
      ...base,
      body: { content: { "application/json": { schema: BotApiCreateProjectBodySchema } } },
    },
    responses: {
      200: {
        description: "Созданный проект",
        content: {
          "application/json": {
            schema: BotApiProjectCreatedSchema,
            example: { id: 55, name: "Новый бот" },
          },
        },
      },
      ...BOT_API_AUTH_ERRORS,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/bot/projects/import",
    tags: ["bot"],
    summary: "Импорт project.json → новый проект",
    description:
      BOT_API_AUTH_DOC +
      "Тело: `{ sheets }` или `{ json_data }`. Токены очищаются. " +
      "**Клиент:** `use-no-projects` + Bot Manager.\n\n" +
      "```bash\ncurl -s -X POST 'http://localhost:5000/api/bot/projects/import?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' -d @project.json\n```",
    security: cookieSecurity,
    request: {
      ...base,
      body: { content: { "application/json": { schema: z.record(z.unknown()) } } },
    },
    responses: {
      200: {
        description: "Созданный проект",
        content: {
          "application/json": {
            schema: BotApiProjectCreatedSchema,
            example: { id: 55, name: "Импортированный проект" },
          },
        },
      },
      400: {
        description: "Нет тела / неверная структура",
        content: { "application/json": { schema: BotApiErrorSchema } },
      },
      ...BOT_API_AUTH_ERRORS,
    },
  });
}
