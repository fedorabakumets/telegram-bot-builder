/**
 * @fileoverview OpenAPI: avatar / messages / send-message / send-node-message.
 * @module server/swagger/paths/projects-user-dialog-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  DeleteDialogMessagesResponseSchema,
  DialogMessageListSchema,
  DialogMessagesQuerySchema,
  DialogProjectUserParamsSchema,
  DialogTokenQuerySchema,
  SendDialogMessageErrorSchema,
  SendDialogMessageRequestSchema,
  SendDialogMessageResponseSchema,
  SendNodeMessageRequestSchema,
} from "../schemas/project-user-dialog";
import {
  AVATAR_NOT_FOUND_EXAMPLE,
  DELETE_MESSAGES_OK_EXAMPLE,
  DIALOG_MESSAGE_EXAMPLE,
  DIALOG_MESSAGES_EMPTY_EXAMPLE,
  NO_TOKEN_EXAMPLE,
  SEND_MESSAGE_BODY_EXAMPLE,
  SEND_NODE_BODY_EXAMPLE,
  SEND_OK_EXAMPLE,
} from "./projects-user-dialog-examples";

/**
 * Регистрирует эндпоинты диалога с пользователем бота.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsUserDialogPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/users/{userId}/avatar",
    tags: ["project-dialogs"],
    summary: "Аватар пользователя или бота (прокси)",
    description:
      "Проксирует фото профиля из Telegram (или кэш `avatar_url` / `bot_photo_url`). " +
      "`userId=bot` или id бота — аватар бота проекта.\n\n" +
      "**Ответ 200:** бинарное изображение (`image/jpeg` и т.п.), Cache-Control 1 день.\n\n" +
      "**Клиент:** `user-avatar`, PanelHeader диалогов.\n\n" +
      "```bash\n" +
      "curl -s -o avatar.jpg -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/users/123456789/avatar?tokenId=7'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: DialogProjectUserParamsSchema,
      query: DialogTokenQuerySchema,
    },
    responses: {
      200: {
        description: "Байты изображения",
        content: {
          "image/jpeg": {
            schema: z.string().openapi({ format: "binary" }),
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
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: { message: "Нет прав доступа к проекту" },
          },
        },
      },
      404: {
        description: "Нет фото / не удалось скачать",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: AVATAR_NOT_FOUND_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка прокси / БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось получить аватарку" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/users/{userId}/messages",
    tags: ["project-dialogs"],
    summary: "История сообщений диалога",
    description:
      "Последние N сообщений `bot_messages` (+ media), в хронологическом порядке. " +
      "По умолчанию limit=100. Фильтр `messageType=user|bot`. Скоуп по `tokenId`.\n\n" +
      "**Клиент:** панель диалога, last-message, детали пользователя.\n\n" +
      "```bash\n" +
      "curl -s -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/users/123456789/messages?tokenId=7&limit=50'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: DialogProjectUserParamsSchema,
      query: DialogMessagesQuerySchema,
    },
    responses: {
      200: {
        description: "Массив сообщений (может быть пустым)",
        content: {
          "application/json": {
            schema: DialogMessageListSchema,
            examples: {
              withMessages: {
                summary: "Есть сообщения",
                value: [DIALOG_MESSAGE_EXAMPLE],
              },
              empty: {
                summary: "Пусто",
                value: DIALOG_MESSAGES_EMPTY_EXAMPLE,
              },
            },
          },
        },
      },
      400: {
        description: "Неверный projectId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверный ID проекта" },
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
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: { message: "Нет прав доступа к проекту" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось получить сообщения" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/projects/{projectId}/users/{userId}/messages",
    tags: ["project-dialogs"],
    summary: "Удалить историю сообщений диалога",
    description:
      "Удаляет все `bot_messages` пользователя в скоупе проекта/токена. " +
      "Не удаляет сообщения в Telegram — только запись в Studio БД.\n\n" +
      "UI сейчас почти не вызывает; API доступен для очистки истории.\n\n" +
      "```bash\n" +
      "curl -s -X DELETE -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/users/123456789/messages?tokenId=7'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: DialogProjectUserParamsSchema,
      query: DialogTokenQuerySchema,
    },
    responses: {
      200: {
        description: "История очищена",
        content: {
          "application/json": {
            schema: DeleteDialogMessagesResponseSchema,
            example: DELETE_MESSAGES_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Неверный projectId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверный ID проекта" },
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
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: { message: "Нет прав доступа к проекту" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось удалить сообщения" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/users/{userId}/send-message",
    tags: ["project-dialogs"],
    summary: "Отправить сообщение пользователю от бота",
    description:
      "Шлёт текст/медиа/кнопки через Telegram Bot API, пишет в `bot_messages`, " +
      "публикует WS `new-message`. Подставляет переменные из `user_data`.\n\n" +
      "**Тело:** `messageText`, опционально `mediaUrls`, `buttons`, `buttonsPerRow`. " +
      "Нужен токен проекта (`tokenId` в query или default).\n\n" +
      "**Клиент:** поле ввода панели диалога (`use-send-message`).\n\n" +
      "```bash\n" +
      "curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  'http://localhost:5000/api/projects/42/users/123456789/send-message?tokenId=7' \\\n" +
      "  -d '{\"messageText\":\"Здравствуйте!\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: DialogProjectUserParamsSchema,
      query: DialogTokenQuerySchema,
      body: {
        content: {
          "application/json": {
            schema: SendDialogMessageRequestSchema,
            example: SEND_MESSAGE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Отправлено в Telegram и сохранено",
        content: {
          "application/json": {
            schema: SendDialogMessageResponseSchema,
            example: SEND_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Валидация / нет токена / нечего отправлять",
        content: {
          "application/json": {
            schema: SendDialogMessageErrorSchema,
            examples: {
              noToken: { summary: "Нет токена", value: NO_TOKEN_EXAMPLE },
              empty: {
                summary: "Пустое тело",
                value: {
                  message: "Нечего отправлять: добавьте текст, медиа или кнопки",
                },
              },
            },
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
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: { message: "Нет прав доступа к проекту" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/users/{userId}/send-node-message",
    tags: ["project-dialogs"],
    summary: "Отправить содержимое узла сценария пользователю",
    description:
      "Берёт узел по `nodeId` из `project.data`, рендерит текст/медиа/кнопки " +
      "(с переменными) и шлёт через бота. В `messageData` помечает " +
      "`sentFromAdmin` + `nodeId`.\n\n" +
      "**Клиент:** «Отправить ноду» в диалоге (`use-send-node`).\n\n" +
      "```bash\n" +
      "curl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  'http://localhost:5000/api/projects/42/users/123456789/send-node-message?tokenId=7' \\\n" +
      "  -d '{\"nodeId\":\"welcome-msg\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: DialogProjectUserParamsSchema,
      query: DialogTokenQuerySchema,
      body: {
        content: {
          "application/json": {
            schema: SendNodeMessageRequestSchema,
            example: SEND_NODE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Узел отправлен",
        content: {
          "application/json": {
            schema: SendDialogMessageResponseSchema,
            example: SEND_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Нет nodeId / нет токена",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            examples: {
              missing: {
                summary: "Нет nodeId",
                value: { message: "projectId и nodeId обязательны" },
              },
              noToken: {
                summary: "Нет токена",
                value: { message: "Токен бота не найден" },
              },
            },
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
        description: "Нет доступа к проекту",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: { message: "Нет прав доступа к проекту" },
          },
        },
      },
      404: {
        description: "Проект или узел не найден",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            examples: {
              project: {
                summary: "Нет проекта",
                value: { message: "Проект не найден" },
              },
              node: {
                summary: "Нет узла",
                value: { message: "Узел не найден" },
              },
            },
          },
        },
      },
    },
  });
}
