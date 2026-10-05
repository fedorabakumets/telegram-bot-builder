/**
 * @fileoverview OpenAPI: /api/support/* — чат пользователя Studio
 * @module server/swagger/paths/support-user-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  SupportErrorSchema,
  SupportMessageSchema,
  SupportReadOkSchema,
  SupportSessionCookiesSchema,
  SupportUserMessageBodySchema,
  UserSupportThreadResponseSchema,
} from "../schemas/support-chat";
import {
  SUPPORT_USER_MESSAGE_BODY_EXAMPLE,
  USER_SUPPORT_THREAD_EXAMPLE,
} from "./support-examples";

/** Ответ 401 пользовательского API поддержки */
const unauthorized = {
  description: "Нет session cookie и Bearer PAT",
  content: {
    "application/json": {
      schema: SupportErrorSchema,
      example: { error: "UNAUTHORIZED" },
    },
  },
};

/**
 * Регистрирует пути чата поддержки со стороны пользователя Studio.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie или Bearer PAT
 * @returns void
 */
export function registerSupportUserPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/support/thread",
    tags: ["support"],
    summary: "Свой диалог поддержки",
    description:
      "Диалог текущего пользователя и сообщения. `thread` равен `null`, пока пользователь ни разу не писал. " +
      "Auth: cookie `connect.sid` или Bearer PAT, виден только свой чат. UI: кнопка чата в шапке.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/support/thread -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: SupportSessionCookiesSchema },
    responses: {
      200: {
        description: "Диалог и сообщения",
        content: {
          "application/json": {
            schema: UserSupportThreadResponseSchema,
            example: USER_SUPPORT_THREAD_EXAMPLE,
          },
        },
      },
      401: unauthorized,
      500: {
        description: "Ошибка базы",
        content: {
          "application/json": {
            schema: SupportErrorSchema,
            example: { error: "Не удалось загрузить чат поддержки" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/support/messages",
    tags: ["support"],
    summary: "Написать в поддержку",
    description:
      "Создаёт диалог при первом сообщении, увеличивает непрочитанное у администратора и переоткрывает закрытый чат. " +
      "Поля `text` и `files` (картинки). Пустая отправка без текста и без файлов — 400. `context` — JSON-строка.\n\n" +
      "```bash\ncurl -s -X POST http://localhost:5000/api/support/messages -b cookies.txt -F text='Не сохраняется сценарий' -F files=@screen.png\n```",
    security: cookieSecurity,
    request: {
      cookies: SupportSessionCookiesSchema,
      body: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: SupportUserMessageBodySchema,
            example: SUPPORT_USER_MESSAGE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Сообщение сохранено",
        content: {
          "application/json": {
            schema: SupportMessageSchema,
            example: USER_SUPPORT_THREAD_EXAMPLE.messages[0],
          },
        },
      },
      400: {
        description: "Пустое сообщение, файл не картинка, больше 8 МБ или текст длиннее 4000",
        content: {
          "application/json": {
            schema: SupportErrorSchema,
            example: { error: "Сообщение не может быть пустым" },
          },
        },
      },
      401: unauthorized,
      500: {
        description: "Ошибка базы",
        content: {
          "application/json": {
            schema: SupportErrorSchema,
            example: { error: "Не удалось отправить сообщение" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/support/read",
    tags: ["support"],
    summary: "Отметить ответы прочитанными",
    description:
      "Обнуляет `unreadByUser` своего диалога. Если диалога ещё нет, отвечает `{ ok: true }` без ошибки.\n\n" +
      "```bash\ncurl -s -X POST http://localhost:5000/api/support/read -b cookies.txt\n```",
    security: cookieSecurity,
    request: { cookies: SupportSessionCookiesSchema },
    responses: {
      200: {
        description: "Счётчик обнулён",
        content: { "application/json": { schema: SupportReadOkSchema, example: { ok: true } } },
      },
      401: unauthorized,
    },
  });
}
