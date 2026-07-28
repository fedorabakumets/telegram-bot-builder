/**
 * @fileoverview OpenAPI path: POST start-offline-all
 * @module server/swagger/paths/bot-runtime-start-offline-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import {
  StartOfflineAllResponseSchema,
  StartOfflineProgressEventDataSchema,
} from "../schemas/bot-runtime-start-offline";

/** Регистрация схем события в OpenAPI */
void StartOfflineProgressEventDataSchema;

/**
 * Регистрирует path массового запуска офлайн-ботов
 * @param registry - OpenAPI registry
 * @param cookieSecurity - Security cookie/PAT
 */
export function registerBotStartOfflinePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/bot/start-offline-all",
    tags: ["bots"],
    summary: "Запустить всех офлайн-ботов проекта",
    description:
      "Последовательно запускает токены проекта, у которых status !== running. "
      + "Уже работающие не трогает (в отличие от restart-all). "
      + "Требуется доступ к проекту (`requireProjectAccess`). "
      + "**Side-effects:** WS `bot-started` на каждый успешный старт и "
      + "`start-offline-progress` (whitelist без секретов; см. docs/api/realtime-events.md). "
      + "UI обновляется без F5. При большом числе токенов HTTP может быть долгим.",
    security: cookieSecurity,
    request: {
      params: z.object({
        id: z.string().openapi({ example: "1", description: "ID проекта" }),
      }),
    },
    responses: {
      200: {
        description: "Сводка запуска",
        content: {
          "application/json": { schema: StartOfflineAllResponseSchema },
        },
      },
      400: {
        description: "Неверный ID проекта",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа к проекту",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      404: {
        description: "Токены не найдены",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });
}
