/**
 * @fileoverview OpenAPI: GET /api/bot-logs/{logId}.
 * @module server/swagger/paths/bot-logs-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { UnauthorizedSchema } from "../schemas/common";
import {
  BotLogDtoSchema,
  BotLogErrorSchema,
  BotLogIdParamsSchema,
  BotLogsCookiesSchema,
} from "../schemas/bot-logs";

/** Пример успешного ответа */
const BOT_LOG_OK_EXAMPLE = {
  id: 42,
  projectId: 266,
  tokenId: 7,
  launchId: 15,
  content: "Bot started successfully",
  type: "stdout",
  timestamp: "2026-08-08T20:00:00.000Z",
};

/**
 * Регистрирует permalink-загрузку одной строки лога.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotLogsPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/bot-logs/{logId}",
    tags: ["bot-logs"],
    summary: "Одна строка лога бота по ID",
    description:
      "Читает запись из `bot_logs` для **постоянных ссылок** терминала (`?log=`).\n\n" +
      "Если строка ещё в памяти UI — запрос не нужен; клиент зовёт API только когда " +
      "строки нет в `BotLogsContext` (`use-terminal-log-url`).\n\n" +
      "**Доступ:** владелец/collaborator проекта `log.projectId` (`hasProjectAccess`). " +
      "Чужой лог → **403**. Несуществующий id → **404**.\n\n" +
      "Список/live логов — другие пути " +
      "(`GET /api/projects/{projectId}/tokens/{tokenId}/logs`, WebSocket).\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/bot-logs/42 -b cookies.txt\n" +
      "# или\n" +
      "curl -s http://localhost:5000/api/bot-logs/42 \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: BotLogsCookiesSchema,
      params: BotLogIdParamsSchema,
    },
    responses: {
      200: {
        description: "Запись лога",
        content: {
          "application/json": {
            schema: BotLogDtoSchema,
            example: BOT_LOG_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "logId не число",
        content: {
          "application/json": {
            schema: BotLogErrorSchema,
            example: { error: "Некорректный logId" },
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
      403: {
        description: "Нет доступа к проекту лога",
        content: {
          "application/json": {
            schema: BotLogErrorSchema,
            example: { error: "Нет прав доступа к проекту" },
          },
        },
      },
      404: {
        description: "Запись не найдена",
        content: {
          "application/json": {
            schema: BotLogErrorSchema,
            example: { error: "Запись лога не найдена" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: BotLogErrorSchema,
            example: { error: "Ошибка получения лога" },
          },
        },
      },
    },
  });
}
