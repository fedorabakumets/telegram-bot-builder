/**
 * @fileoverview OpenAPI: login / logout / status админки.
 * @module server/swagger/paths/admin-auth-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  AdminLoginFormSchema,
  AdminStatusResponseSchema,
} from "../schemas/admin-auth";
import { AdminCookiesSchema } from "../schemas/admin-common";
import { ADMIN_CURL_LOGIN } from "./admin-examples";

/**
 * Регистрирует публичные эндпоинты сессии admin.
 * @param registry - Реестр zod-to-openapi
 * @returns void
 */
export function registerAdminAuthPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "post",
    path: "/admin/api/login",
    tags: ["admin"],
    summary: "Войти в админку",
    description:
      "Форма с полем `key` = `ADMIN_API_KEY`. При успехе ставит httpOnly cookie " +
      "`admin_auth` (Path=/admin, 7 дней, HMAC от ключа) и редиректит на `/admin` " +
      "или `/admin/settings` (если платформа ещё не настроена).\n\n" +
      "Неверный ключ → 302 на `/admin/login?error=1`. Без ключа в non-prod → 503; " +
      "в production без `ADMIN_API_KEY` весь `/admin` не монтируется.\n\n" +
      "**UI:** `/admin/login`. User `connect.sid` / Bearer PAT здесь не работают.\n\n" +
      "```bash\n" +
      `${ADMIN_CURL_LOGIN}\n` +
      "```",
    security: [],
    request: {
      body: {
        required: true,
        content: {
          "application/x-www-form-urlencoded": {
            schema: AdminLoginFormSchema,
            example: { key: "YOUR_ADMIN_API_KEY" },
          },
        },
      },
    },
    responses: {
      302: {
        description:
          "Успех → Location `/admin` или `/admin/settings` + Set-Cookie. " +
          "Ошибка ключа → `/admin/login?error=1`",
      },
      503: {
        description: "Admin не настроен (нет ключа)",
        content: {
          "text/plain": {
            schema: z.string().openapi({ example: "Admin не настроен" }),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/admin/api/logout",
    tags: ["admin"],
    summary: "Выйти из админки",
    description:
      "Сбрасывает cookie `admin_auth` и редиректит на `/admin/login`.\n\n" +
      "**UI:** кнопка «Выйти» на hub `/admin`.\n\n" +
      "```bash\ncurl -s -c admin.txt -b admin.txt -X POST http://localhost:5000/admin/api/logout\n```",
    security: [],
    request: { cookies: AdminCookiesSchema },
    responses: {
      302: { description: "Location `/admin/login`, cookie очищена" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/admin/api/status",
    tags: ["admin"],
    summary: "Статус admin-сессии",
    description:
      "Публичный JSON: валидна ли `admin_auth` и доступна ли админка. " +
      "`adminEnabled` всегда `true`, если роут смонтирован.\n\n" +
      "```bash\ncurl -s -b admin.txt http://localhost:5000/admin/api/status\n```",
    security: [],
    request: { cookies: AdminCookiesSchema },
    responses: {
      200: {
        description: "Состояние сессии",
        content: {
          "application/json": {
            schema: AdminStatusResponseSchema,
            example: { authenticated: true, adminEnabled: true },
          },
        },
      },
    },
  });
}
