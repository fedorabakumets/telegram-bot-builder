/**
 * @fileoverview OpenAPI: прочтение и смена статуса диалога поддержки
 * @module server/swagger/paths/admin-support-thread-status-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { ADMIN_SECURITY, AdminCookiesSchema } from "../schemas/admin-common";
import { SupportErrorSchema, SupportStatusBodySchema, SupportThreadSchema } from "../schemas/support-chat";
import { ADMIN_CURL_LOGIN } from "./admin-examples";
import {
  adminSupportBadId,
  adminSupportNotFound,
  adminSupportUnauthorized,
  supportThreadIdParams,
} from "./admin-support-responses";
import { SUPPORT_STATUS_BODY_EXAMPLE, SUPPORT_THREAD_EXAMPLE } from "./support-examples";

/**
 * Регистрирует отметку прочтения и смену статуса диалога.
 * @param registry - Реестр zod-to-openapi
 * @returns void
 */
export function registerAdminSupportThreadStatusPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "post",
    path: "/admin/api/support/threads/{id}/read",
    tags: ["admin"],
    summary: "Отметить диалог прочитанным",
    description:
      "Обнуляет `unreadByAdmin`.\n\n```bash\n" + `${ADMIN_CURL_LOGIN}\n` +
      "curl -s -X POST http://localhost:5000/admin/api/support/threads/1/read -b admin.txt\n```",
    security: ADMIN_SECURITY,
    request: { cookies: AdminCookiesSchema, params: supportThreadIdParams },
    responses: {
      200: {
        description: "Обновлённый диалог",
        content: { "application/json": { schema: SupportThreadSchema, example: SUPPORT_THREAD_EXAMPLE } },
      },
      400: adminSupportBadId,
      401: adminSupportUnauthorized,
      404: adminSupportNotFound,
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/admin/api/support/threads/{id}",
    tags: ["admin"],
    summary: "Закрыть или открыть диалог",
    description:
      "Меняет статус. Новое сообщение пользователя само переводит закрытый диалог в `open`.\n\n" +
      "```bash\n" + `${ADMIN_CURL_LOGIN}\n` +
      "curl -s -X PATCH http://localhost:5000/admin/api/support/threads/1 -b admin.txt " +
      "-H 'Content-Type: application/json' -d '{\"status\":\"closed\"}'\n```",
    security: ADMIN_SECURITY,
    request: {
      cookies: AdminCookiesSchema,
      params: supportThreadIdParams,
      body: {
        required: true,
        content: {
          "application/json": { schema: SupportStatusBodySchema, example: SUPPORT_STATUS_BODY_EXAMPLE },
        },
      },
    },
    responses: {
      200: {
        description: "Обновлённый диалог",
        content: {
          "application/json": {
            schema: SupportThreadSchema,
            example: { ...SUPPORT_THREAD_EXAMPLE, status: "closed" },
          },
        },
      },
      400: {
        description: "Статус не open/closed или неверный id",
        content: {
          "application/json": {
            schema: SupportErrorSchema,
            example: { error: "Статус должен быть open или closed" },
          },
        },
      },
      401: adminSupportUnauthorized,
      404: adminSupportNotFound,
    },
  });
}
