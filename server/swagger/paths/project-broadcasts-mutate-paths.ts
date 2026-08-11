/**
 * @fileoverview OpenAPI: PUT edit + DELETE рассылки.
 * @module server/swagger/paths/project-broadcasts-mutate-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema, ValidationErrorSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectBroadcastsIdParamsSchema } from "../schemas/project-broadcasts";
import {
  DeleteBroadcastResponseSchema,
  EditBroadcastRequestSchema,
  EditBroadcastResponseSchema,
} from "../schemas/project-broadcasts-detail";
import {
  DELETE_BROADCAST_RESPONSE_EXAMPLE,
  EDIT_BROADCAST_BODY_EXAMPLE,
  EDIT_BROADCAST_RESPONSE_EXAMPLE,
  PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
} from "./project-broadcasts-examples";

/**
 * Регистрирует редактирование и удаление рассылки.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBroadcastsMutatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/broadcasts/{broadcastId}",
    tags: ["project-broadcasts"],
    summary: "Редактировать текст рассылки",
    description:
      "Обновляет `messageText` в БД и через `editMessageText` у получателей " +
      "(throttle ~25/s). Текст 1…4096 после trim.\n\n" +
      "**Клиент:** `broadcast-dialog-panel`.\n\n" +
      "```bash\ncurl -s -X PUT -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"messageText\":\"Обновлённый текст\"}' \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcasts/15'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBroadcastsIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: EditBroadcastRequestSchema,
            example: EDIT_BROADCAST_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Сколько сообщений отредактировано",
        content: {
          "application/json": {
            schema: EditBroadcastResponseSchema,
            example: EDIT_BROADCAST_RESPONSE_EXAMPLE,
          },
        },
      },
      400: {
        description: "Валидация body",
        content: {
          "application/json": {
            schema: ValidationErrorSchema,
            example: { message: "Неверное тело запроса", errors: [] },
          },
        },
      },
      401: {
        description: "Нет session / PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      404: {
        description: "Не найдена",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Рассылка не найдена" },
          },
        },
      },
      500: {
        description: "Внутренняя ошибка",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Внутренняя ошибка сервера" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/projects/{projectId}/broadcasts/{broadcastId}",
    tags: ["project-broadcasts"],
    summary: "Удалить рассылку",
    description:
      "Удаляет сообщения в Telegram (если есть `telegramMessageId`), запись рассылки " +
      "и связанные `bot_messages`. Токен только своего проекта.\n\n" +
      "**Клиент:** `broadcast-dialog-panel`.\n\n" +
      "```bash\ncurl -s -X DELETE -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcasts/15'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBroadcastsIdParamsSchema,
    },
    responses: {
      200: {
        description: "Удалено",
        content: {
          "application/json": {
            schema: DeleteBroadcastResponseSchema,
            example: DELETE_BROADCAST_RESPONSE_EXAMPLE,
          },
        },
      },
      400: {
        description: "Неверные ID",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверные параметры запроса" },
          },
        },
      },
      401: {
        description: "Нет session / PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      404: {
        description: "Не найдена",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Рассылка не найдена" },
          },
        },
      },
      500: {
        description: "Внутренняя ошибка",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Внутренняя ошибка сервера" },
          },
        },
      },
    },
  });
}
