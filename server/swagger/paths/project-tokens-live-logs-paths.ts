/**
 * @fileoverview OpenAPI: GET/DELETE …/tokens/{tokenId}/logs.
 * @module server/swagger/paths/project-tokens-live-logs-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { BotLogDtoSchema } from "../schemas/bot-logs";
import { ProjectsCookiesSchema } from "../schemas/projects";
import { ProjectTokensProjectTokenParamsSchema } from "../schemas/project-tokens-params";
import { LIVE_LOG_EXAMPLE } from "./project-tokens-examples";

/** Query limit для live-логов */
const LiveLogsQuerySchema = z.object({
  /** Макс. строк (default 500) */
  limit: z
    .string()
    .optional()
    .openapi({
      example: "500",
      param: {
        description: "Максимум строк логов (по умолчанию 500)",
        example: "500",
      },
    }),
});

/**
 * Регистрирует live-логи токена.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensLiveLogsPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/tokens/{tokenId}/logs",
    tags: ["project-tokens"],
    summary: "Live-логи бота (bot_logs)",
    description:
      "Последние строки `getLatestLaunchLogs` (default limit=500).\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** терминал логов бота.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/projects/42/tokens/7/logs?limit=100' -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      query: LiveLogsQuerySchema,
    },
    responses: {
      200: {
        description: "Массив строк логов",
        content: {
          "application/json": {
            schema: z.array(BotLogDtoSchema),
            example: [LIVE_LOG_EXAMPLE],
          },
        },
      },
      400: {
        description: "Некорректные id",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
            example: { error: "Некорректные projectId или tokenId" },
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
        content: { "application/json": { schema: ForbiddenSchema } },
      },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/projects/{projectId}/tokens/{tokenId}/logs",
    tags: ["project-tokens"],
    summary: "Очистить live-логи токена",
    description:
      "Удаляет live-логи (без launch_id) из БД и буфера.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "```bash\ncurl -s -X DELETE http://localhost:5000/api/projects/42/tokens/7/logs -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensProjectTokenParamsSchema,
    },
    responses: {
      200: {
        description: "Очищено",
        content: {
          "application/json": {
            schema: z.object({ success: z.literal(true) }),
            example: { success: true },
          },
        },
      },
      400: {
        description: "Некорректные id",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });
}
