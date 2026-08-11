/**
 * @fileoverview OpenAPI: PUT …/tokens/{tokenId}/bot-info.
 * @module server/swagger/paths/project-tokens-bot-info-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import { ProjectTokensIdTokenParamsSchema } from "../schemas/project-tokens-params";
import {
  BotInfoUpdateRequestSchema,
  BotInfoUpdateResponseSchema,
} from "../schemas/project-tokens-settings";

/**
 * Регистрирует обновление профиля бота через Telegram API.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensBotInfoPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/{id}/tokens/{tokenId}/bot-info",
    tags: ["project-tokens"],
    summary: "Обновить name/description бота в Telegram",
    description:
      "Body `{ field, value }`. `field`: `name` → setMyName, `description` → setMyDescription, " +
      "`shortDescription` → setMyShortDescription. Пишет в локальную БД после успеха Telegram.\n\n" +
      "**Auth:** `requireTokenOwnership` (владелец/collaborator + сверка projectId).\n\n" +
      "**Клиент:** настройки профиля бота.\n\n" +
      "```bash\n" +
      "curl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/bot-info -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"field\":\"name\",\"value\":\"Новое имя\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensIdTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: BotInfoUpdateRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Обновлено",
        content: {
          "application/json": {
            schema: BotInfoUpdateResponseSchema,
            example: { success: true, field: "name", value: "Новое имя" },
          },
        },
      },
      400: {
        description: "Нет field/value / Invalid field / Telegram error",
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
        description: "Токен не найден в проекте",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Token not found" },
          },
        },
      },
    },
  });
}
