/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/users (список).
 * @module server/swagger/paths/bot-users-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { BotUsersPageSchema } from "../schemas/bot-users";
import {
  BotUsersListQuerySchema,
  BotUsersProjectIdParamsSchema,
} from "../schemas/bot-users-params";
import { ProjectsCookiesSchema } from "../schemas/projects";
import {
  BOT_USERS_FORBIDDEN_EXAMPLE,
  BOT_USERS_PAGE_EXAMPLE,
} from "./bot-users-examples";
import { registerBotUsersDeleteOnePaths } from "./bot-users-delete-one-paths";
import { registerBotUsersPutPaths } from "./bot-users-put-paths";

/**
 * Регистрирует list и CRUD одного пользователя (без POST/GET one).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotUsersPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/users",
    tags: ["project-users"],
    summary: "Список пользователей и диалогов проекта",
    description:
      "Вкладки «Диалоги» / «Пользователи». С `limit` — `{ users, total, hasMore }`; " +
      "без `limit` — плоский массив. `dialogKind` фильтрует личные/группы/каналы.\n\n" +
      "**Auth:** cookie / Bearer PAT (`requireApiAuth`) + проверка доступа к проекту.\n\n" +
      "**Клиент:** список диалогов, `use-system-tables` (таблица «Пользователи»).\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/users?limit=50&tokenId=7' -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: BotUsersProjectIdParamsSchema,
      query: BotUsersListQuerySchema,
    },
    responses: {
      200: {
        description: "Пагинированный список или массив",
        content: {
          "application/json": {
            schema: BotUsersPageSchema,
            example: BOT_USERS_PAGE_EXAMPLE,
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
    },
  });

  registerBotUsersPutPaths(registry, cookieSecurity);
  registerBotUsersDeleteOnePaths(registry, cookieSecurity);
}
