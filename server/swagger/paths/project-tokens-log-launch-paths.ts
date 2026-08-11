/**
 * @fileoverview OpenAPI: log-level / launch-settings токена.
 * @module server/swagger/paths/project-tokens-log-launch-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import { ProjectTokensProjectTokenParamsSchema } from "../schemas/project-tokens-params";
import {
  LaunchSettingsRequestSchema,
  LaunchSettingsResponseSchema,
  LogLevelRequestSchema,
  LogLevelResponseSchema,
} from "../schemas/project-tokens-settings";

/**
 * Регистрирует log-level и launch-settings.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensLogLaunchPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const errors = {
    400: {
      description: "Недопустимое значение",
      content: { "application/json": { schema: MessageErrorSchema } },
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
      description: "Нет владения токеном",
      content: { "application/json": { schema: ForbiddenSchema } },
    },
    404: {
      description: "Токен не найден",
      content: { "application/json": { schema: MessageErrorSchema } },
    },
  } as const;

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/log-level",
    tags: ["project-tokens"],
    summary: "Уровень логирования бота",
    description:
      "`logLevel`: DEBUG|INFO|WARNING|ERROR. Пишет LOG_LEVEL в `.env`. " +
      "WS `token-updated`.\n\n" +
      "**Auth:** `requireTokenOwnership`.\n\n" +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/log-level \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' -d '{\"logLevel\":\"WARNING\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: { "application/json": { schema: LogLevelRequestSchema } },
      },
    },
    responses: {
      200: {
        description: "Сохранено",
        content: {
          "application/json": {
            schema: LogLevelResponseSchema,
            example: { success: true, logLevel: "WARNING" },
          },
        },
      },
      ...errors,
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/launch-settings",
    tags: ["project-tokens"],
    summary: "Режим запуска polling/webhook",
    description:
      "`launchMode` polling|webhook; опционально `webhookBaseUrl`, `webhookSecretToken`. " +
      "При смене webhook→polling вызывается Telegram `deleteWebhook`. " +
      "**Риск:** ответ может вернуть `webhookSecretToken`.\n\n" +
      "**Auth:** `requireTokenOwnership`. WS `token-updated`.\n\n" +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/launch-settings \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"launchMode\":\"polling\"}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: LaunchSettingsRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Сохранено",
        content: {
          "application/json": {
            schema: LaunchSettingsResponseSchema,
            example: {
              success: true,
              launchMode: "polling",
              webhookBaseUrl: null,
              webhookSecretToken: null,
            },
          },
        },
      },
      ...errors,
    },
  });
}
