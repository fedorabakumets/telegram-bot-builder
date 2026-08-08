/**
 * @fileoverview OpenAPI: auth-модель и ключевые paths тега bot.
 * @module server/swagger/paths/bot-api-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { UnauthorizedSchema } from "../schemas/common";
import {
  BotApiCookiesSchema,
  BotApiErrorSchema,
  BotApiProjectListSchema,
  BotApiTelegramIdQuerySchema,
} from "../schemas/bot-api";

/** Общее описание безопасности `/api/bot/*` */
export const BOT_API_AUTH_DOC =
  "**Auth (обязательно):** session cookie `connect.sid` **или** `Authorization: Bearer mcp_…`.\n\n" +
  "**Кто действует (actor):**\n" +
  "- Личная сессия / обычный PAT: actor = `req.user.id`. " +
  "Query `telegram_id`, если передан, **обязан совпадать** (иначе 403).\n" +
  "- PAT со scope **`bot_manager`**: actor = query `telegram_id` (обязателен). " +
  "Так работает шаблон Bot Manager: Bearer `{STUDIO_BOT_MANAGER_TOKEN}` " +
  "(значение — PAT с `bot_manager`, кладётся в server env и в env бота).\n\n" +
  "**Не безопасно:** вызывать с чужим `telegram_id` под обычным логином — будет 403.\n\n";

/**
 * Регистрирует эталонные paths тега bot (+ auth-модель).
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/bot/projects",
    tags: ["bot"],
    summary: "Список проектов актора",
    description:
      BOT_API_AUTH_DOC +
      "Safe DTO без data/token. **Клиент:** Bot Manager; UI не зовёт.\n\n" +
      "```bash\n" +
      "# bot_manager PAT\n" +
      "curl -s 'http://localhost:5000/api/bot/projects?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n\n" +
      "# личная сессия (telegram_id = свой или опустить)\n" +
      "curl -s 'http://localhost:5000/api/bot/projects' -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      query: BotApiTelegramIdQuerySchema.partial(),
    },
    responses: {
      200: {
        description: "items + count",
        content: {
          "application/json": {
            schema: BotApiProjectListSchema,
            example: {
              items: [{ id: 42, name: "Мой бот", description: "" }],
              count: 1,
            },
          },
        },
      },
      400: {
        description: "bot_manager без telegram_id / некорректный id",
        content: { "application/json": { schema: BotApiErrorSchema } },
      },
      401: {
        description: "Нет session/PAT",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "telegram_id ≠ авторизованный user (без bot_manager)",
        content: { "application/json": { schema: BotApiErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/bot/projects/import",
    tags: ["bot"],
    summary: "Импорт project.json → новый проект",
    description:
      BOT_API_AUTH_DOC +
      "**Клиент:** `use-no-projects` (session + свой telegram_id) и Bot Manager.\n\n" +
      "```bash\n" +
      "curl -s -X POST 'http://localhost:5000/api/bot/projects/import?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…' -H 'Content-Type: application/json' -d @project.json\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      query: BotApiTelegramIdQuerySchema.partial(),
      body: {
        content: { "application/json": { schema: z.record(z.unknown()) } },
      },
    },
    responses: {
      200: {
        description: "Созданный проект",
        content: {
          "application/json": {
            schema: z.object({ id: z.number().int() }),
            example: { id: 55 },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Чужой telegram_id без bot_manager",
        content: { "application/json": { schema: BotApiErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/bot/projects/{id}/collaborators",
    tags: ["bot"],
    summary: "Список коллабораторов проекта",
    description:
      BOT_API_AUTH_DOC +
      "**Клиент:** `use-collaborators` (UI). Write-операции collaborators только здесь.\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/bot/projects/42/collaborators?telegram_id=123' -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      params: z.object({
        id: z.string().openapi({
          example: "42",
          param: { description: "ID проекта", example: "42" },
        }),
      }),
      query: BotApiTelegramIdQuerySchema.partial(),
    },
    responses: {
      200: {
        description: "Список коллабораторов",
        content: { "application/json": { schema: z.record(z.unknown()) } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа / чужой telegram_id",
        content: { "application/json": { schema: BotApiErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/bot/tokens/{tokenId}/status",
    tags: ["bot"],
    summary: "Статус инстанса бота по tokenId",
    description:
      BOT_API_AUTH_DOC +
      "Доступ: actor имеет hasProjectAccess к проекту токена. " +
      "Секрет token в ответе не отдаётся. **Клиент:** Bot Manager, `lib/bot-tools`.\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/bot/tokens/7/status?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: BotApiCookiesSchema,
      params: z.object({
        tokenId: z.string().openapi({
          example: "7",
          param: { description: "ID токена или token_7", example: "7" },
        }),
      }),
      query: BotApiTelegramIdQuerySchema.partial(),
    },
    responses: {
      200: {
        description: "Статус + instance (без token)",
        content: { "application/json": { schema: z.record(z.unknown()) } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа к проекту токена",
        content: { "application/json": { schema: BotApiErrorSchema } },
      },
      404: {
        description: "Токен не найден",
        content: { "application/json": { schema: BotApiErrorSchema } },
      },
    },
  });
}
