/**
 * @fileoverview OpenAPI: GET /users/stats и GET /users/traffic.
 * @module server/swagger/paths/bot-users-stats-traffic-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  BotUserStatsSchema,
  TrafficDataSchema,
} from "../schemas/bot-users-analytics";
import {
  BotUsersProjectIdParamsSchema,
  BotUsersTokenQuerySchema,
} from "../schemas/bot-users-params";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  BOT_USERS_FORBIDDEN_EXAMPLE,
  BOT_USERS_STATS_EXAMPLE,
  BOT_USERS_TRAFFIC_EXAMPLE,
} from "./bot-users-examples";

/**
 * Регистрирует агрегаты stats и traffic пользователей проекта.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotUsersStatsTrafficPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/users/stats",
    tags: ["project-users"],
    summary: "Агрегированная статистика пользователей",
    description:
      "Счётчики из `bot_users` + `totalInteractions` из `bot_messages` " +
      "(COUNT входящих и исходящих). Опциональный `tokenId`.\n\n" +
      "**Auth:** cookie / Bearer PAT; при известном owner — `hasProjectAccess`.\n\n" +
      "**Клиент:** `use-stats`, карточки дашборда базы пользователей.\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/users/stats?tokenId=7' -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: BotUsersProjectIdParamsSchema,
      query: BotUsersTokenQuerySchema,
    },
    responses: {
      200: {
        description: "Агрегаты (числа после parseInt на сервере)",
        content: {
          "application/json": {
            schema: BotUserStatsSchema,
            example: BOT_USERS_STATS_EXAMPLE,
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
            example: { message: "Failed to fetch user stats" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/users/traffic",
    tags: ["project-users"],
    summary: "Источники трафика и языки пользователей",
    description:
      "`sources` — группировка по `COALESCE(deep_link_param,'direct')` с %. " +
      "`languages` — топ-20 `language_code` (NULL исключены) с %.\n\n" +
      "**Клиент:** `use-traffic` (нормализует count/percentage в number).\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/users/traffic?tokenId=7' -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: BotUsersProjectIdParamsSchema,
      query: BotUsersTokenQuerySchema,
    },
    responses: {
      200: {
        description: "sources + languages",
        content: {
          "application/json": {
            schema: TrafficDataSchema,
            example: BOT_USERS_TRAFFIC_EXAMPLE,
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
            example: { message: "Ошибка при получении данных трафика" },
          },
        },
      },
    },
  });
}
