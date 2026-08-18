/**
 * @fileoverview OpenAPI path: POST start-offline-all.
 * @module server/swagger/paths/bot-runtime-start-offline-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  StartOfflineAllResponseSchema,
  StartOfflineProgressEventDataSchema,
} from "../schemas/bot-runtime-start-offline";
import { ProjectBotIdParamsSchema } from "../schemas/project-bot";

/** Регистрация схем события в OpenAPI */
void StartOfflineProgressEventDataSchema;

const START_OFFLINE_OK_EXAMPLE = {
  started: 2,
  failed: 0,
  skippedRunning: 1,
  results: [
    { tokenId: 7, success: true, processId: "12345" },
    { tokenId: 8, success: true, processId: "12346" },
  ],
};

/**
 * Регистрирует path массового запуска офлайн-ботов.
 * @param registry - OpenAPI registry
 * @param cookieSecurity - Security cookie/PAT
 * @returns void
 */
export function registerBotStartOfflinePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/bot/start-offline-all",
    tags: ["project-bot"],
    summary: "Запустить всех офлайн-ботов проекта",
    description:
      "Последовательно запускает токены проекта со status !== running и действительным токеном. " +
      "Уже running и токены с isActive=0 (Telegram отклонил) не трогает (в отличие от restart-all).\n\n" +
      "**Доступ:** `requireProjectAccess`.\n\n" +
      "**Side-effects:** WS `bot-started`, `start-offline-progress` " +
      "(без секретов; см. docs/api/realtime-events.md).\n\n" +
      "**Клиент:** `use-bot-mutations` / BotManagement. MCP: `db_start_offline_bots`.\n\n" +
      "При большом числе токенов HTTP долгий (пауза ~400ms между стартами).\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/1/bot/start-offline-all -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBotIdParamsSchema,
    },
    responses: {
      200: {
        description: "Сводка запуска",
        content: {
          "application/json": {
            schema: StartOfflineAllResponseSchema,
            example: START_OFFLINE_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Неверный ID проекта",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Некорректный ID проекта" },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: { message: "Нет доступа к проекту" },
          },
        },
      },
      404: {
        description: "Токены не найдены",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Токены не найдены" },
          },
        },
      },
    },
  });
}
