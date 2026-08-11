/**
 * @fileoverview OpenAPI: GET /users/variables и DELETE wipe /users.
 * @module server/swagger/paths/bot-users-extra-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  BotUsersProjectIdParamsSchema,
  BotUsersTokenQuerySchema,
} from "../schemas/bot-users-params";
import {
  BotUsersVariablesQuerySchema,
  BotUsersVariablesResponseSchema,
  WipeAllBotUsersSuccessSchema,
} from "../schemas/bot-users-variables";
import { ProjectsCookiesSchema } from "../schemas/projects";
import {
  BOT_USERS_FORBIDDEN_EXAMPLE,
  BOT_USERS_VARIABLES_EXAMPLE,
  BOT_USERS_WIPE_OK_EXAMPLE,
} from "./bot-users-examples";
import { registerBotUsersPopularButtonsPaths } from "./bot-users-popular-buttons-paths";

/**
 * Регистрирует variables, wipe и делегирует popular-buttons.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotUsersExtraPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registerBotUsersPopularButtonsPaths(registry, cookieSecurity);

  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/users/variables",
    tags: ["project-users"],
    summary: "Переменные user_data как таблица",
    description:
      "Пользователи с непустым `user_data`. `columns` = user_id, username + " +
      "ключи user_data (без `_`/`waiting_`/`input_`). Значения — строки.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** `use-system-tables` (таблица «Переменные»).\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/users/variables?limit=200&tokenId=7' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: BotUsersProjectIdParamsSchema,
      query: BotUsersVariablesQuerySchema,
    },
    responses: {
      200: {
        description: "{ columns, rows }",
        content: {
          "application/json": {
            schema: BotUsersVariablesResponseSchema,
            example: BOT_USERS_VARIABLES_EXAMPLE,
          },
        },
      },
      401: {
        description: "Нет session cookie и Bearer PAT",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа к проекту (requireProjectAccess)",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: BOT_USERS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Ошибка при получении переменных" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/projects/{id}/users",
    tags: ["project-users"],
    summary: "Удалить всех пользователей и сообщения проекта",
    description:
      "Wipe: DELETE из `bot_users` и `bot_messages` по project_id " +
      "(и token_id, если задан). `deletedCount` — сумма rowCount обеих таблиц.\n\n" +
      "**UI:** очистка базы (`use-delete-all-users`). Не путать с DELETE …/users/{userId}.\n\n" +
      "```bash\n" +
      "curl -s -X DELETE 'http://localhost:5000/api/projects/42/users?tokenId=7' -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: BotUsersProjectIdParamsSchema,
      query: BotUsersTokenQuerySchema,
    },
    responses: {
      200: {
        description: "Данные очищены",
        content: {
          "application/json": {
            schema: WipeAllBotUsersSuccessSchema,
            example: BOT_USERS_WIPE_OK_EXAMPLE,
          },
        },
      },
      401: {
        description: "Нет session cookie и Bearer PAT",
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
            schema: MessageErrorSchema,
            example: BOT_USERS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка удаления",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to delete user data" },
          },
        },
      },
    },
  });
}
