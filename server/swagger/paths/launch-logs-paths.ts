/**
 * @fileoverview OpenAPI: GET /api/launch/{launchId}/logs.
 * @module server/swagger/paths/launch-logs-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { UnauthorizedSchema } from "../schemas/common";
import {
  BotLogDtoSchema,
  BotLogErrorSchema,
  BotLogsCookiesSchema,
} from "../schemas/bot-logs";
import { z } from "zod";

/** Path launchId */
const LaunchIdParamsSchema = z.object({
  launchId: z.string().openapi({
    example: "15",
    description: "ID записи bot_launch_history",
    param: {
      description: "ID запуска в bot_launch_history",
      example: "15",
    },
  }),
});

/** Пример массива логов запуска */
const LAUNCH_LOGS_EXAMPLE = [
  {
    id: 42,
    projectId: 266,
    tokenId: 7,
    launchId: 15,
    content: "Bot started successfully",
    type: "stdout",
    timestamp: "2026-08-08T20:00:00.000Z",
  },
];

/**
 * Регистрирует логи одного запуска бота.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerLaunchLogsPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/launch/{launchId}/logs",
    tags: ["launch"],
    summary: "Логи конкретного запуска бота",
    description:
      "Все строки `bot_logs` с данным `launchId` (хронология запуска).\n\n" +
      "**Доступ:** projectId берётся из первой строки логов → `hasProjectAccess`. " +
      "Чужой проект → **403**.\n\n" +
      "**Пустой набор логов** трактуется как отсутствие запуска → **404** " +
      "(не раскрывает id без данных).\n\n" +
      "**Клиент:** `use-launch-logs` → LaunchLogsModal / LaunchHistoryViewer.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/launch/15/logs -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: BotLogsCookiesSchema,
      params: LaunchIdParamsSchema,
    },
    responses: {
      200: {
        description: "Массив логов запуска",
        content: {
          "application/json": {
            schema: z.array(BotLogDtoSchema),
            example: LAUNCH_LOGS_EXAMPLE,
          },
        },
      },
      400: {
        description: "launchId не число",
        content: {
          "application/json": {
            schema: BotLogErrorSchema,
            example: { error: "Некорректный launchId" },
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
        description: "Нет доступа к проекту запуска",
        content: {
          "application/json": {
            schema: BotLogErrorSchema,
            example: { error: "Нет прав доступа" },
          },
        },
      },
      404: {
        description: "Запуск не найден (нет логов)",
        content: {
          "application/json": {
            schema: BotLogErrorSchema,
            example: { error: "Запуск не найден" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: BotLogErrorSchema,
            example: { error: "Ошибка получения логов" },
          },
        },
      },
    },
  });
}
