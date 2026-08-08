/**
 * @fileoverview OpenAPI: POST /api/auth/telegram (Login Widget).
 * @module server/swagger/paths/auth-telegram-widget-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { AuthErrorSchema } from "../schemas/common";
import {
  TelegramAuthRequestSchema,
  TelegramAuthResponseSchema,
} from "../schemas/auth";
import {
  TELEGRAM_AUTH_BODY_EXAMPLE,
  TELEGRAM_AUTH_OK_EXAMPLE,
} from "./auth-examples";

/**
 * Регистрирует Widget login.
 * @param registry - Реестр zod-to-openapi
 * @param publicSecurity - Пустой security
 * @returns void
 */
export function registerAuthTelegramWidgetPaths(
  registry: OpenAPIRegistry,
  publicSecurity: never[],
): void {
  registry.registerPath({
    method: "post",
    path: "/api/auth/telegram",
    tags: ["auth"],
    summary: "Вход / смена аккаунта (Telegram Login Widget)",
    description:
      "Реальный login (не restore после reload). Создаёт/обновляет `telegram_users`, " +
      "ставит cookie `connect.sid`, мигрирует гостевые проекты текущей session.\n\n" +
      "**Поля тела:** `id`, `first_name` (+ опционально last_name, username, photo_url, auth_date).\n" +
      "**`id_token`:** обязателен в режиме `telegram_widget` / production без skip; " +
      "в dev-login режиме proof не требуется.\n\n" +
      "**Смена аккаунта:** другой `id` при уже залогиненной сессии → `regenerateSession`, " +
      "`switched: true`. Проекты прошлого пользователя не переносятся.\n\n" +
      "**Клиент:** `useTelegramLogin` / Telegram Login Widget.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/auth/telegram \\\n" +
      "  -H 'Content-Type: application/json' -c cookies.txt \\\n" +
      "  -d '{\"id\":123456789,\"first_name\":\"Иван\",\"id_token\":\"eyJ...\"}'\n" +
      "```",
    security: publicSecurity,
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: TelegramAuthRequestSchema,
            example: TELEGRAM_AUTH_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Авторизация успешна, cookie установлена",
        content: {
          "application/json": {
            schema: TelegramAuthResponseSchema,
            example: TELEGRAM_AUTH_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Не передан id / битое тело",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "ID пользователя обязателен" },
          },
        },
      },
      401: {
        description: "Нет или невалиден id_token / proof",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "Требуется id_token" },
          },
        },
      },
      429: {
        description: "Rate limit auth",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "Too many requests" },
          },
        },
      },
    },
  });
}
