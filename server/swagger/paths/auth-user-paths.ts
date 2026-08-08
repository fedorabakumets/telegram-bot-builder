/**
 * @fileoverview OpenAPI: GET /api/auth/telegram/user/{id}.
 * @module server/swagger/paths/auth-user-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { AuthErrorSchema } from "../schemas/common";
import {
  GetTelegramUserResponseSchema,
  TelegramUserIdParamsSchema,
} from "../schemas/auth";
import { GET_USER_OK_EXAMPLE } from "./auth-examples";

/**
 * Регистрирует получение пользователя по Telegram id.
 * @param registry - Реестр zod-to-openapi
 * @param publicSecurity - Пустой security
 * @returns void
 */
export function registerAuthUserPaths(
  registry: OpenAPIRegistry,
  publicSecurity: never[],
): void {
  registry.registerPath({
    method: "get",
    path: "/api/auth/telegram/user/{id}",
    tags: ["auth"],
    summary: "Пользователь Telegram по ID",
    description:
      "Публичное чтение записи из `telegram_users` по числовому id.\n\n" +
      "**Параметр path:** `id` — Telegram user id.\n\n" +
      "Не создаёт сессию и не требует cookie. Studio login на этот эндпоинт не опирается " +
      "(источник правды — `GET /api/auth/me`).\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/auth/telegram/user/123456789\n" +
      "```",
    security: publicSecurity,
    request: { params: TelegramUserIdParamsSchema },
    responses: {
      200: {
        description: "Пользователь найден",
        content: {
          "application/json": {
            schema: GetTelegramUserResponseSchema,
            example: GET_USER_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Невалидный id",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "Требуется ID пользователя" },
          },
        },
      },
      404: {
        description: "Нет записи в БД",
        content: {
          "application/json": {
            schema: AuthErrorSchema,
            example: { success: false, error: "Пользователь не найден" },
          },
        },
      },
    },
  });
}
