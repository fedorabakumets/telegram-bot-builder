/**
 * @fileoverview OpenAPI: DELETE /api/projects/{projectId}/messages/{messageId}.
 * @module server/swagger/paths/project-messages-delete-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { DeleteMessageSuccessSchema } from "../schemas/project-messages-dto";
import {
  ProjectMessagesItemParamsSchema,
  ProjectMessagesResolveTokenQuerySchema,
} from "../schemas/project-messages-params";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  PROJECT_MESSAGE_DELETE_OK_EXAMPLE,
  PROJECT_MESSAGE_OWNERSHIP_FORBIDDEN_EXAMPLE,
  PROJECT_MESSAGES_FORBIDDEN_EXAMPLE,
} from "./project-messages-examples";

/**
 * Регистрирует удаление одного сообщения (Telegram → БД → WS).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectMessagesDeletePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/projects/{projectId}/messages/{messageId}",
    tags: ["project-messages"],
    summary: "Удалить сообщение из чата и базы",
    description:
      "Удаляет одно сообщение из панели Диалогов: сначала в Telegram, " +
      "при успехе — из нашей БД, затем обновление UI по WebSocket.\n\n" +
      "Нужен Telegram message id у записи. Если Telegram отклонил запрос — " +
      "запись в БД не трогаем (400).\n\n" +
      "Query `tokenId` — каким ботом слать `deleteMessage` " +
      "(иначе дефолтный/первый токен проекта).\n\n" +
      "**Auth:** cookie или Bearer PAT + доступ к проекту.\n\n" +
      "**Клиент:** диалоги → `use-delete-message`.\n\n" +
      "```bash\n" +
      "curl -s -X DELETE 'http://localhost:5000/api/projects/42/messages/501?tokenId=7' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectMessagesItemParamsSchema,
      query: ProjectMessagesResolveTokenQuerySchema,
    },
    responses: {
      200: {
        description: "Удалено в Telegram и БД",
        content: {
          "application/json": {
            schema: DeleteMessageSuccessSchema,
            example: PROJECT_MESSAGE_DELETE_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Неверные ID / нет telegramMessageId / нет токена / Telegram reject",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            examples: {
              badIds: {
                value: { message: "Неверный ID проекта или сообщения" },
              },
              noTelegramId: {
                value: {
                  message: "Сообщение не имеет Telegram ID — удаление недоступно",
                },
              },
              noToken: {
                value: { message: "Токен бота не найден для этого проекта" },
              },
              telegramReject: {
                value: {
                  message: "Telegram не принял удаление: message to delete not found",
                },
              },
            },
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
        description: "Нет доступа к проекту или message.projectId mismatch",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            examples: {
              noAccess: { value: PROJECT_MESSAGES_FORBIDDEN_EXAMPLE },
              ownership: { value: PROJECT_MESSAGE_OWNERSHIP_FORBIDDEN_EXAMPLE },
            },
          },
        },
      },
      404: {
        description: "Сообщение не найдено",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Сообщение не найдено" },
          },
        },
      },
      500: {
        description: "Внутренняя ошибка",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось удалить сообщение" },
          },
        },
      },
    },
  });
}
