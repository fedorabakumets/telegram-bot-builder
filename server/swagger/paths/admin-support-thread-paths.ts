/**
 * @fileoverview OpenAPI: чтение диалога поддержки и ответ администратора
 * @module server/swagger/paths/admin-support-thread-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { ADMIN_SECURITY, AdminCookiesSchema } from "../schemas/admin-common";
import {
  AdminSupportThreadResponseSchema,
  SupportAdminMessageBodySchema,
  SupportErrorSchema,
  SupportMessageSchema,
} from "../schemas/support-chat";
import { ADMIN_CURL_LOGIN } from "./admin-examples";
import {
  adminSupportBadId,
  adminSupportNotFound,
  adminSupportUnauthorized,
  supportThreadIdParams,
} from "./admin-support-responses";
import {
  ADMIN_SUPPORT_THREAD_EXAMPLE,
  SUPPORT_ADMIN_MESSAGE_BODY_EXAMPLE,
  SUPPORT_ADMIN_MESSAGE_EXAMPLE,
} from "./support-examples";

/**
 * Регистрирует GET диалога и POST ответа.
 * @param registry - Реестр zod-to-openapi
 * @returns void
 */
export function registerAdminSupportThreadPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/admin/api/support/threads/{id}",
    tags: ["admin"],
    summary: "Диалог поддержки",
    description:
      "Диалог, профиль автора и сообщения. **Auth:** cookie `admin_auth`. **UI:** `/admin/support/{id}`.\n\n" +
      "```bash\n" + `${ADMIN_CURL_LOGIN}\n` +
      "curl -s http://localhost:5000/admin/api/support/threads/1 -b admin.txt\n```",
    security: ADMIN_SECURITY,
    request: { cookies: AdminCookiesSchema, params: supportThreadIdParams },
    responses: {
      200: {
        description: "Диалог с сообщениями",
        content: {
          "application/json": {
            schema: AdminSupportThreadResponseSchema,
            example: ADMIN_SUPPORT_THREAD_EXAMPLE,
          },
        },
      },
      400: adminSupportBadId,
      401: adminSupportUnauthorized,
      404: adminSupportNotFound,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/admin/api/support/threads/{id}/messages",
    tags: ["admin"],
    summary: "Ответить пользователю",
    description:
      "Сохраняет ответ администратора и отмечает диалог прочитанным. Поля `text` и `files`. Источник ответа — `web`.\n\n" +
      "```bash\n" + `${ADMIN_CURL_LOGIN}\n` +
      "curl -s -X POST http://localhost:5000/admin/api/support/threads/1/messages -b admin.txt " +
      "-F text='Проверьте сохранение ещё раз.' -F files=@screen.png\n```",
    security: ADMIN_SECURITY,
    request: {
      cookies: AdminCookiesSchema,
      params: supportThreadIdParams,
      body: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: SupportAdminMessageBodySchema,
            example: SUPPORT_ADMIN_MESSAGE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Ответ сохранён",
        content: {
          "application/json": { schema: SupportMessageSchema, example: SUPPORT_ADMIN_MESSAGE_EXAMPLE },
        },
      },
      400: {
        description: "Пустое сообщение, файл не картинка, больше 8 МБ, текст длиннее 4000 или неверный id",
        content: {
          "application/json": {
            schema: SupportErrorSchema,
            example: { error: "Сообщение не может быть пустым" },
          },
        },
      },
      401: adminSupportUnauthorized,
      404: adminSupportNotFound,
    },
  });
}
