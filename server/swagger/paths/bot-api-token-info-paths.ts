/**
 * @fileoverview OpenAPI: status/photo/stats токена.
 * @module server/swagger/paths/bot-api-token-info-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  BotApiCookiesSchema,
  BotApiTelegramIdQuerySchema,
  BotApiTokenIdParamsSchema,
} from "../schemas/bot-api";
import { BotApiTokenStatsSchema } from "../schemas/bot-api-extra";
import {
  BotApiTokenPhotoSchema,
  BotApiTokenStatusSchema,
} from "../schemas/bot-api-runtime";
import { BOT_API_AUTH_DOC } from "./bot-api-auth-doc";
import { BOT_API_CRUD_ERRORS } from "./bot-api-responses";

/**
 * Регистрирует GET status, photo, stats.
 * @param registry - Реестр
 * @param cookieSecurity - Security schemes
 * @returns void
 */
export function registerBotApiTokenInfoPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const req = {
    cookies: BotApiCookiesSchema,
    params: BotApiTokenIdParamsSchema,
    query: BotApiTelegramIdQuerySchema.partial(),
  };

  registry.registerPath({
    method: "get",
    path: "/api/bot/tokens/{tokenId}/status",
    tags: ["bot"],
    summary: "Статус инстанса бота",
    description:
      BOT_API_AUTH_DOC +
      "Секрет token не отдаётся. **Клиент:** Bot Manager, `lib/bot-tools`.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/tokens/7/status?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: req,
    responses: {
      200: {
        description: "status + instance",
        content: {
          "application/json": {
            schema: BotApiTokenStatusSchema,
            example: {
              status: "running",
              instance: {
                botName: "@my_bot",
                botUsername: "my_bot",
                tokenId: 7,
                status: "running",
                statusLabel: "🟢 Работает",
                uptime: "1ч 2м",
              },
            },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/bot/tokens/{tokenId}/photo",
    tags: ["bot"],
    summary: "Аватар бота (локальный URL)",
    description:
      BOT_API_AUTH_DOC +
      "Скачивает фото в `/uploads/…`. Без аватара — `photoUrl: null`. **Клиент:** Bot Manager.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/tokens/7/photo?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: req,
    responses: {
      200: {
        description: "Путь или null",
        content: {
          "application/json": {
            schema: BotApiTokenPhotoSchema,
            example: { photoUrl: "/uploads/42/bot_photos/token_7_avatar.jpg", total_count: 1 },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/bot/tokens/{tokenId}/stats",
    tags: ["bot"],
    summary: "Статистика пользователей токена",
    description:
      BOT_API_AUTH_DOC +
      "Числа без форматирования. **Клиент:** unused.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/tokens/7/stats?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: req,
    responses: {
      200: {
        description: "Счётчики",
        content: {
          "application/json": {
            schema: BotApiTokenStatsSchema,
            example: { total_users: 100, active_24h: 12, active_7d: 40, new_today: 3 },
          },
        },
      },
      ...BOT_API_CRUD_ERRORS,
    },
  });
}
