/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/users/growth-by-source.
 * @module server/swagger/paths/bot-users-growth-by-source-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  BotUsersGrowthBySourceQuerySchema,
  GrowthBySourceListSchema,
} from "../schemas/bot-users-growth";
import { BotUsersProjectIdParamsSchema } from "../schemas/bot-users-params";
import { ProjectsCookiesSchema } from "../schemas/projects";
import {
  BOT_USERS_FORBIDDEN_EXAMPLE,
  BOT_USERS_GROWTH_BY_SOURCE_EXAMPLE,
} from "./bot-users-examples";

/**
 * Регистрирует прирост пользователей с разбивкой по источникам.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotUsersGrowthBySourcePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/users/growth-by-source",
    tags: ["project-users"],
    summary: "Прирост пользователей по источникам",
    description:
      "`granularity` обязателен (иначе 400). Ключи `sources` — " +
      "`COALESCE(deep_link_param,'direct')`. Для 5m — особый truncate минут.\n\n" +
      "**Клиент:** `use-growth-by-source`.\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/users/growth-by-source?granularity=1d&tokenId=7' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: BotUsersProjectIdParamsSchema,
      query: BotUsersGrowthBySourceQuerySchema,
    },
    responses: {
      200: {
        description: "Массив [{ date, sources }]",
        content: {
          "application/json": {
            schema: GrowthBySourceListSchema,
            example: BOT_USERS_GROWTH_BY_SOURCE_EXAMPLE,
          },
        },
      },
      400: {
        description: "Нет granularity",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Параметр granularity обязателен" },
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
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: {
              message: "Ошибка при получении данных прироста по источникам",
            },
          },
        },
      },
    },
  });
}
