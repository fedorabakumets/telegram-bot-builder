/**
 * @fileoverview OpenAPI: DELETE token + PUT messages-retention (project-tokens).
 * @module server/swagger/paths/bot-tokens-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
  ValidationErrorSchema,
} from "../schemas/common";
import {
  TokenUpdatedEventDataSchema,
  TokenUpdatedPayloadSchema,
  UpdateMessagesRetentionRequestSchema,
  UpdateMessagesRetentionResponseSchema,
} from "../schemas/bot-tokens";
import { ProjectsCookiesSchema } from "../schemas/projects";
import { ProjectTokensProjectTokenParamsSchema } from "../schemas/project-tokens-params";
import { registerBotTokensRuntimePaths } from "./bot-tokens-runtime-paths";

/** Регистрация схем token-updated в OpenAPI (side-effect import) */
void TokenUpdatedPayloadSchema;
void TokenUpdatedEventDataSchema;

/**
 * Регистрирует retention/delete (project-tokens) и runtime /api/tokens/*.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security cookie / PAT
 * @returns void
 */
export function registerBotTokensPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/messages-retention",
    tags: ["project-tokens"],
    summary: "Срок хранения сообщений диалога",
    description:
      "Обновляет `messagesRetentionDays`. `0` — без автоочистки; иначе раз в час " +
      "чистит `bot_messages` старше N дней. `message_activity_daily` не трогается.\n\n" +
      "**Auth:** `requireTokenOwnership`. **Side-effect:** WS `token-updated`.\n\n" +
      "**Клиент:** настройки токена / retention.\n\n" +
      "```bash\ncurl -s -X PUT http://localhost:5000/api/projects/42/tokens/7/messages-retention \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' -d '{\"messagesRetentionDays\":60}'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensProjectTokenParamsSchema,
      body: {
        content: {
          "application/json": { schema: UpdateMessagesRetentionRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Настройка сохранена",
        content: {
          "application/json": {
            schema: UpdateMessagesRetentionResponseSchema,
            example: { success: true, messagesRetentionDays: 60 },
          },
        },
      },
      400: {
        description: "Неверный ID или значение вне whitelist",
        content: {
          "application/json": {
            schema: z.union([MessageErrorSchema, ValidationErrorSchema]),
          },
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
    method: "delete",
    path: "/api/projects/{projectId}/tokens/{tokenId}",
    tags: ["project-tokens"],
    summary: "Удалить токен бота проекта",
    description:
      "Останавливает бота и удаляет токен. Сверка `token.projectId` с `:projectId`.\n\n" +
      "**Auth:** `requireTokenOwnership` → `hasProjectAccess`.\n\n" +
      "**Side-effect:** WS `token-deleted`.\n\n" +
      "```bash\ncurl -s -X DELETE http://localhost:5000/api/projects/42/tokens/7 -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensProjectTokenParamsSchema,
    },
    responses: {
      200: {
        description: "Токен удалён",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string().openapi({ example: "Token deleted successfully" }),
            }),
            example: { message: "Token deleted successfully" },
          },
        },
      },
      400: {
        description: "Некорректный projectId или tokenId",
        content: { "application/json": { schema: MessageErrorSchema } },
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
        description: "Токен не найден в этом проекте",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registerBotTokensRuntimePaths(registry, cookieSecurity);
}
