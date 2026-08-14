/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/users/growth.
 * @module server/swagger/paths/bot-users-growth-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  BotUsersGrowthQuerySchema,
  GrowthPointListSchema,
} from "../schemas/bot-users-growth";
import { BotUsersProjectIdParamsSchema } from "../schemas/bot-users-params";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  BOT_USERS_FORBIDDEN_EXAMPLE,
  BOT_USERS_GROWTH_EXAMPLE,
} from "./bot-users-examples";
import { registerBotUsersGrowthBySourcePaths } from "./bot-users-growth-by-source-paths";

/**
 * Регистрирует график прироста пользователей.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotUsersGrowthPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/users/growth",
    tags: ["project-users"],
    summary: "Прирост пользователей по времени",
    description:
      "С `granularity` (1m|5m|1h|1w|1d|7d|30d) — ряд слотов `generate_series`, " +
      "date в ISO. Без него — legacy `period` (7d|30d|90d, default 30d), " +
      "date как YYYY-MM-DD; пустой результат — fallback на 90 дней.\n\n" +
      "**Клиент:** `use-growth` (всегда шлёт granularity).\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/users/growth?granularity=1d&tokenId=7' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: BotUsersProjectIdParamsSchema,
      query: BotUsersGrowthQuerySchema,
    },
    responses: {
      200: {
        description: "Массив [{ date, count }]",
        content: {
          "application/json": {
            schema: GrowthPointListSchema,
            example: BOT_USERS_GROWTH_EXAMPLE,
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
            example: { message: "Ошибка при получении данных прироста" },
          },
        },
      },
    },
  });

  registerBotUsersGrowthBySourcePaths(registry, cookieSecurity);
}
