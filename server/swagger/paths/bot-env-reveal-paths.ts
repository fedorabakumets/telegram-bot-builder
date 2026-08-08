/**
 * @fileoverview OpenAPI: reveal секретного значения env бота.
 * @module server/swagger/paths/bot-env-reveal-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { UnauthorizedSchema } from "../schemas/common";
import {
  BotEnvCookiesSchema,
  BotEnvIdParamsSchema,
  BotEnvNestedParamsSchema,
  BotEnvRevealErrorSchema,
  BotEnvRevealResponseSchema,
} from "../schemas/bot-env-reveal";
import { BotApiTelegramIdQuerySchema } from "../schemas/bot-api";
import { BOT_API_AUTH_DOC } from "./bot-api-auth-doc";

/** Предупреждение о чувствительности ответа */
const REVEAL_RISK =
  "**Риск:** ответ содержит **сырое** значение env. В списке секреты маскируются. " +
  "Не логируйте тело ответа.\n\n";

/**
 * Регистрирует reveal (legacy `/api/bot/env` и UI nested).
 * @param registry - Реестр
 * @param cookieSecurity - Session / Bearer
 * @returns void
 */
export function registerBotEnvRevealPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/bot/env/{id}/reveal",
    tags: ["bot"],
    summary: "Раскрыть секретное значение env (legacy)",
    description:
      BOT_API_AUTH_DOC +
      REVEAL_RISK +
      "`requireBotEnvVariableOwnership`. UI не вызывает (см. nested). **Клиент:** unused.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/bot/env/15/reveal?telegram_id=123' \\\n" +
      "  -H 'Authorization: Bearer mcp_…'\n```",
    security: cookieSecurity,
    request: {
      cookies: BotEnvCookiesSchema,
      params: BotEnvIdParamsSchema,
      query: BotApiTelegramIdQuerySchema.partial(),
    },
    responses: {
      200: {
        description: "Сырое значение",
        content: {
          "application/json": {
            schema: BotEnvRevealResponseSchema,
            example: { value: "super-secret-api-key" },
          },
        },
      },
      400: {
        description: "Некорректный id / bot_manager без telegram_id",
        content: { "application/json": { schema: BotEnvRevealErrorSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа",
        content: {
          "application/json": {
            schema: BotEnvRevealErrorSchema,
            example: { error: "Нет доступа" },
          },
        },
      },
      404: {
        description: "Не найдено",
        content: { "application/json": { schema: BotEnvRevealErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/tokens/{tokenId}/env-variables/{id}/reveal",
    tags: ["tokens"],
    summary: "Раскрыть секретное значение env токена",
    description:
      REVEAL_RISK +
      "**Кто:** `requireTokenOwnership`. **Клиент:** `use-env-variables` / BotEnvRow.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/projects/42/tokens/7/env-variables/15/reveal \\\n" +
      "  -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: BotEnvCookiesSchema, params: BotEnvNestedParamsSchema },
    responses: {
      200: {
        description: "Сырое значение",
        content: {
          "application/json": {
            schema: BotEnvRevealResponseSchema,
            example: { value: "super-secret-api-key" },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа",
        content: { "application/json": { schema: BotEnvRevealErrorSchema } },
      },
      404: {
        description: "Не найдено / чужой tokenId",
        content: { "application/json": { schema: BotEnvRevealErrorSchema } },
      },
    },
  });
}
