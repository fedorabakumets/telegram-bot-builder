/**
 * @fileoverview OpenAPI: GET /api/bots.
 * @module server/swagger/paths/bots-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  BotInstanceListSchema,
  BotsCookiesSchema,
} from "../schemas/bots";

/** Пример списка без секретов */
const BOTS_LIST_EXAMPLE = [
  {
    id: 1,
    projectId: 266,
    tokenId: 7,
    status: "running",
    processId: "12345",
    startedAt: "2026-08-08T20:00:00.000Z",
    stoppedAt: null,
    errorMessage: null,
  },
];

/**
 * Регистрирует список инстансов ботов текущего пользователя.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotsListPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/bots",
    tags: ["bots"],
    summary: "Инстансы ботов текущего пользователя",
    description:
      "Все `bot_instances` по проектам владельца (и доступным). " +
      "**Секрет Telegram token в ответе не отдаётся**.\n\n" +
      "Без личности → `[]` (не 401 на уровне хендлера; глобальный auth всё равно требует login).\n\n" +
      "UI сейчас почти не вызывает; предпочтительны token-scoped status API.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/bots -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: { cookies: BotsCookiesSchema },
    responses: {
      200: {
        description: "Массив инстансов без поля token",
        content: {
          "application/json": {
            schema: BotInstanceListSchema,
            example: BOTS_LIST_EXAMPLE,
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
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to fetch bot instances" },
          },
        },
      },
    },
  });
}
