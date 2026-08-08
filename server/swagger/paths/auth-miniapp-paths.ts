/**
 * @fileoverview OpenAPI: POST /api/auth/telegram/miniapp.
 * @module server/swagger/paths/auth-miniapp-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { AuthErrorSchema } from "../schemas/common";
import {
  MiniAppAuthRequestSchema,
  TelegramAuthResponseSchema,
} from "../schemas/auth";
import { MINIAPP_BODY_EXAMPLE, TELEGRAM_AUTH_OK_EXAMPLE } from "./auth-examples";

/**
 * Регистрирует Mini App login.
 * @param registry - Реестр zod-to-openapi
 * @param publicSecurity - Пустой security
 * @returns void
 */
export function registerAuthMiniAppPaths(
  registry: OpenAPIRegistry,
  publicSecurity: never[],
): void {
  registry.registerPath({
    method: "post",
    path: "/api/auth/telegram/miniapp",
    tags: ["auth"],
    summary: "Вход из Telegram Mini App (initData)",
    description:
      "Верифицирует `initData` HMAC бот-токеном (`telegram_bot_token` в admin settings), " +
      "создаёт сессию. Логика смены аккаунта как у Widget (`switched`).\n\n" +
      "**Тело:** `{ \"initData\": \"<Telegram.WebApp.initData>\" }`.\n\n" +
      "В development без bot token проверка HMAC ослаблена; в production без токена — 500.\n\n" +
      "**Клиент:** `useMiniAppAuth` при открытии внутри Telegram.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/auth/telegram/miniapp \\\n" +
      "  -H 'Content-Type: application/json' -c cookies.txt \\\n" +
      "  -d '{\"initData\":\"user=%7B%22id%22%3A123...&hash=...\"}'\n" +
      "```",
    security: publicSecurity,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: MiniAppAuthRequestSchema,
            example: MINIAPP_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Сессия создана / обновлена",
        content: {
          "application/json": {
            schema: TelegramAuthResponseSchema,
            example: TELEGRAM_AUTH_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Нет initData или нет user в initData",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "initData обязателен" },
          },
        },
      },
      401: {
        description: "Невалидный initData (HMAC)",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "Невалидный initData" },
          },
        },
      },
      429: {
        description: "Rate limit auth",
        content: { "application/json": { schema: AuthErrorSchema } },
      },
      500: {
        description: "Bot token не настроен (не-dev)",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "Bot token не настроен" },
          },
        },
      },
    },
  });
}
