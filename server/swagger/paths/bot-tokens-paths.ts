/**
 * @fileoverview OpenAPI paths: настройки токена бота (срок хранения сообщений)
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

/** Регистрация схем token-updated в OpenAPI (side-effect import) */
void TokenUpdatedPayloadSchema;
void TokenUpdatedEventDataSchema;

/**
 * Регистрирует OpenAPI path PUT messages-retention
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security cookie / PAT
 * @returns void
 */
export function registerBotTokensPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const params = z.object({
    /** ID проекта (в URL; доступ сверяется с реальным projectId токена) */
    projectId: z.string().openapi({ example: "42", description: "ID проекта" }),
    /** ID токена бота */
    tokenId: z.string().openapi({ example: "7", description: "ID токена бота" }),
  });

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/tokens/{tokenId}/messages-retention",
    tags: ["tokens"],
    summary: "Срок хранения сообщений диалога",
    description:
      "Обновляет `messages_retention_days` у токена. " +
      "`0` — без автоочистки; иначе сервер раз в час удаляет из `bot_messages` " +
      "сообщения этого токена старше N дней. " +
      "Таблица `message_activity_daily` (длинный график «Активность») не трогается. " +
      "Требуется владение токеном (`requireTokenOwnership`). " +
      "**Side-effect:** после успеха эмитит WebSocket `token-updated` " +
      "(безопасный снимок токена без секретов; см. docs/api/realtime-events.md). " +
      "UI и другие клиенты обновляются без F5.",
    security: cookieSecurity,
    request: {
      params,
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
          "application/json": { schema: UpdateMessagesRetentionResponseSchema },
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
    tags: ["tokens"],
    summary: "Удалить токен бота проекта",
    description:
      "Удаляет токен из проекта. Доступ: **владелец или коллаборатор** проекта " +
      "(`requireTokenOwnership` → `hasProjectAccess`). " +
      "Сверяет `token.projectId` с `:projectId` (защита от IDOR). " +
      "Перед удалением останавливает бота. " +
      "**Side-effect:** WebSocket `token-deleted` (UI обновляет список без F5). " +
      "Ответы list/status токенов не содержат сырой Telegram token.",
    security: cookieSecurity,
    request: { params },
    responses: {
      200: {
        description: "Токен удалён",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string().openapi({ example: "Token deleted successfully" }),
            }),
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
}
