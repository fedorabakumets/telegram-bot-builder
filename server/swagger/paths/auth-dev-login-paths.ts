/**
 * @fileoverview OpenAPI: POST /api/auth/dev-login и GET /api/auth/login.
 * @module server/swagger/paths/auth-dev-login-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { AuthErrorSchema } from "../schemas/common";
import { DevLoginRequestSchema, DevLoginResponseSchema } from "../schemas/auth";
import { DEV_LOGIN_BODY_EXAMPLE, DEV_LOGIN_OK_EXAMPLE } from "./auth-examples";

/**
 * Регистрирует dev-login и HTML-страницу входа.
 * @param registry - Реестр zod-to-openapi
 * @param publicSecurity - Пустой security
 * @returns void
 */
export function registerAuthDevLoginPaths(
  registry: OpenAPIRegistry,
  publicSecurity: never[],
): void {
  registry.registerPath({
    method: "post",
    path: "/api/auth/dev-login",
    tags: ["auth"],
    summary: "Dev-вход по Telegram ID (без proof)",
    description:
      "Локальный вход **без** Telegram Widget / id_token. Создаёт пользователя, " +
      "ставит cookie, мигрирует **все** гостевые проекты на этого user.\n\n" +
      "**Когда доступен:** в `/admin/settings` режим `dev_login` " +
      "(или env fallback, пока не выбран `telegram_widget`).\n" +
      "Иначе → **403** `dev-login отключён`.\n\n" +
      "**Тело:** `id` (number), `firstName` (string), опционально `username`.\n\n" +
      "**Клиент:** `AuthDevForm`, popup `/api/auth/login` в dev.\n\n" +
      "⚠️ Не использовать на проде со включённым dev-login — любой может войти под чужим ID.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/auth/dev-login \\\n" +
      "  -H 'Content-Type: application/json' -c cookies.txt \\\n" +
      "  -d '{\"id\":123456789,\"firstName\":\"Иван\",\"username\":\"ivan_p\"}'\n" +
      "```",
    security: publicSecurity,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: DevLoginRequestSchema,
            example: DEV_LOGIN_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Сессия создана",
        content: {
          "application/json": {
            schema: DevLoginResponseSchema,
            example: DEV_LOGIN_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Нет id или firstName",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "id и firstName обязательны" },
          },
        },
      },
      403: {
        description: "Режим telegram_widget / SKIP_AUTH=false",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: {
              success: false,
              error: "Forbidden: dev-login отключён (SKIP_AUTH=false)",
            },
          },
        },
      },
      429: {
        description: "Rate limit auth",
        content: { "application/json": { schema: AuthErrorSchema } },
      },
      500: {
        description: "Сессия/БД",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "Ошибка dev-входа" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/auth/login",
    tags: ["auth"],
    summary: "HTML-страница входа (popup)",
    description:
      "Отдаёт **HTML** (не JSON): Telegram Login Widget или dev-форма по режиму входа.\n\n" +
      "Открывается popup из `useTelegramLogin` (`window.open('/api/auth/login')`). " +
      "После успеха страница шлёт `postMessage` родителю / вызывает `dev-login`.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/auth/login | head\n" +
      "```",
    security: publicSecurity,
    responses: {
      200: {
        description: "HTML страница входа",
        content: {
          "text/html": {
            schema: z.string().openapi({
              example: "<!DOCTYPE html><html>…Telegram Login…</html>",
            }),
          },
        },
      },
    },
  });
}
