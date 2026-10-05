/**
 * @fileoverview OpenAPI: список диалогов поддержки и счётчик непрочитанного
 * @module server/swagger/paths/admin-support-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  ADMIN_SECURITY,
  AdminCookiesSchema,
  AdminUnauthorizedSchema,
} from "../schemas/admin-common";
import {
  AdminSupportThreadListResponseSchema,
  AdminSupportUnreadResponseSchema,
  SupportErrorSchema,
} from "../schemas/support-chat";
import { ADMIN_CURL_LOGIN, ADMIN_UNAUTHORIZED_EXAMPLE } from "./admin-examples";
import { ADMIN_SUPPORT_LIST_ITEM_EXAMPLE } from "./support-examples";

/** Ответ 401 admin API */
const unauthorized = {
  description: "Нет admin-сессии",
  content: {
    "application/json": {
      schema: AdminUnauthorizedSchema,
      example: ADMIN_UNAUTHORIZED_EXAMPLE,
    },
  },
};

/**
 * Регистрирует список диалогов и счётчик непрочитанного.
 * @param registry - Реестр zod-to-openapi
 * @returns void
 */
export function registerAdminSupportListPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/admin/api/support/threads",
    tags: ["admin"],
    summary: "Список диалогов поддержки",
    description:
      "Диалоги с автором и превью последнего сообщения. Сначала с непрочитанным, затем по времени. " +
      "Без `status` возвращаются открытые. Лимит 200.\n\n" +
      "**Auth:** cookie `admin_auth`. **UI:** `/admin/support`.\n\n" +
      "```bash\n" +
      `${ADMIN_CURL_LOGIN}\n` +
      "curl -s 'http://localhost:5000/admin/api/support/threads?status=open' -b admin.txt\n" +
      "```",
    security: ADMIN_SECURITY,
    request: {
      cookies: AdminCookiesSchema,
      query: z.object({
        status: z.enum(["open", "closed", "all"]).optional().openapi({
          description: "Фильтр статуса. По умолчанию open",
          example: "open",
        }),
      }),
    },
    responses: {
      200: {
        description: "Список диалогов",
        content: {
          "application/json": {
            schema: AdminSupportThreadListResponseSchema,
            example: { items: [ADMIN_SUPPORT_LIST_ITEM_EXAMPLE] },
          },
        },
      },
      401: unauthorized,
      500: {
        description: "Внутренняя ошибка",
        content: {
          "application/json": {
            schema: SupportErrorSchema,
            example: { error: "Внутренняя ошибка сервера" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/admin/api/support/unread",
    tags: ["admin"],
    summary: "Сколько сообщений ждут ответа",
    description:
      "Сумма `unread_by_admin` по всем диалогам. Для счётчика в меню админки.\n\n" +
      "```bash\n" +
      `${ADMIN_CURL_LOGIN}\n` +
      "curl -s http://localhost:5000/admin/api/support/unread -b admin.txt\n" +
      "```",
    security: ADMIN_SECURITY,
    request: { cookies: AdminCookiesSchema },
    responses: {
      200: {
        description: "Общее число непрочитанных",
        content: {
          "application/json": {
            schema: AdminSupportUnreadResponseSchema,
            example: { total: 3 },
          },
        },
      },
      401: unauthorized,
    },
  });
}
