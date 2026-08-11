/**
 * @fileoverview OpenAPI: GET /api/tokens/{tokenId}/bot-status и launch-history.
 * @module server/swagger/paths/bot-tokens-runtime-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import {
  BotLaunchHistoryListSchema,
  BotStatusByTokenResponseSchema,
} from "../schemas/bot-tokens";

/**
 * Регистрирует runtime-статус токена (тег `tokens`).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security cookie / PAT
 * @returns void
 */
export function registerBotTokensRuntimePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const tokenIdParams = z.object({
    /** ID токена бота */
    tokenId: z.string().openapi({
      example: "7",
      param: { description: "ID токена бота", example: "7" },
    }),
  });

  registry.registerPath({
    method: "get",
    path: "/api/tokens/{tokenId}/bot-status",
    tags: ["tokens"],
    summary: "Статус бота по токену",
    description:
      "Сверка с процессом / worker pool / `bot_instances`. " +
      "Ответ без сырого token. `Cache-Control: no-store`.\n\n" +
      "**Auth:** `hasProjectAccess` к проекту токена.\n\n" +
      "MCP: `GET /api/bot/tokens/{tokenId}/status` (тег `bot`).\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/tokens/7/bot-status -b cookies.txt\n```",
    security: cookieSecurity,
    request: { params: tokenIdParams },
    responses: {
      200: {
        description: "Статус бота",
        content: {
          "application/json": { schema: BotStatusByTokenResponseSchema },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа к проекту токена",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      404: {
        description: "Токен не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/tokens/{tokenId}/launch-history",
    tags: ["tokens"],
    summary: "История запусков бота",
    description:
      "До 10 записей `bot_launch_history` + reconcile live-статуса.\n\n" +
      "**Auth:** `hasProjectAccess`.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/tokens/7/launch-history -b cookies.txt\n```",
    security: cookieSecurity,
    request: { params: tokenIdParams },
    responses: {
      200: {
        description: "Список записей (до 10)",
        content: {
          "application/json": { schema: BotLaunchHistoryListSchema },
        },
      },
      400: {
        description: "Некорректный tokenId",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string().openapi({ example: "Некорректный tokenId" }),
            }),
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string().openapi({ example: "Нет прав доступа" }),
            }),
          },
        },
      },
      404: {
        description: "Токен не найден",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string().openapi({ example: "Токен не найден" }),
            }),
          },
        },
      },
    },
  });
}
