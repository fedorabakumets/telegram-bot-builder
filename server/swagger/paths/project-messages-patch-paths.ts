/**
 * @fileoverview OpenAPI: PATCH /api/projects/{projectId}/messages/{messageId}.
 * @module server/swagger/paths/project-messages-patch-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  EditMessageRequestSchema,
  EditMessageSuccessSchema,
} from "../schemas/project-messages-dto";
import {
  ProjectMessagesItemParamsSchema,
  ProjectMessagesResolveTokenQuerySchema,
} from "../schemas/project-messages-params";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  PROJECT_MESSAGE_EDIT_BODY_EXAMPLE,
  PROJECT_MESSAGE_EDIT_OK_EXAMPLE,
  PROJECT_MESSAGE_OWNERSHIP_FORBIDDEN_EXAMPLE,
  PROJECT_MESSAGES_FORBIDDEN_EXAMPLE,
} from "./project-messages-examples";

/**
 * Регистрирует редактирование сообщения бота (Telegram → БД → WS).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectMessagesPatchPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "patch",
    path: "/api/projects/{projectId}/messages/{messageId}",
    tags: ["project-messages"],
    summary: "Редактировать сообщение бота (Telegram + БД)",
    description:
      "Только `messageType=bot` с `telegramMessageId`. " +
      "Telegram `editMessageText`/`editMessageCaption`, затем UPDATE БД, " +
      "WS `message-edited`. Пустой `buttons` снимает inline-клавиатуру.\n\n" +
      "`tokenId` (query) → `resolveEffectiveProjectToken`.\n\n" +
      "**Auth:** `requireApiAuth` + `requireProjectAccess`.\n\n" +
      "**Клиент:** `use-edit-message`.\n\n" +
      "```bash\n" +
      "curl -s -X PATCH 'http://localhost:5000/api/projects/42/messages/501?tokenId=7' \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"messageText\":\"Обновлённый текст\"}' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectMessagesItemParamsSchema,
      query: ProjectMessagesResolveTokenQuerySchema,
      body: {
        content: {
          "application/json": {
            schema: EditMessageRequestSchema,
            example: PROJECT_MESSAGE_EDIT_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Отредактировано в Telegram и БД",
        content: {
          "application/json": {
            schema: EditMessageSuccessSchema,
            example: PROJECT_MESSAGE_EDIT_OK_EXAMPLE,
          },
        },
      },
      400: {
        description:
          "Пустой текст / не bot / нет telegramMessageId / нет токена / Telegram reject",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            examples: {
              emptyText: {
                value: { message: "Текст сообщения не может быть пустым" },
              },
              userMsg: {
                value: { message: "Нельзя редактировать сообщения пользователя" },
              },
              noTelegramId: {
                value: {
                  message:
                    "Сообщение не имеет Telegram ID — редактирование недоступно",
                },
              },
              telegramReject: {
                value: {
                  message: "Telegram не принял изменение: message is not modified",
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
            example: { message: "Не удалось отредактировать сообщение" },
          },
        },
      },
    },
  });
}
