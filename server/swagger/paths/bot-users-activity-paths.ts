/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/users/activity.
 * @module server/swagger/paths/bot-users-activity-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  BotUsersActivityQuerySchema,
  UserActivityResponseSchema,
} from "../schemas/bot-users-activity";
import { BotUsersProjectIdParamsSchema } from "../schemas/bot-users-params";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  BOT_USERS_ACTIVITY_EXAMPLE,
  BOT_USERS_FORBIDDEN_EXAMPLE,
} from "./bot-users-examples";

/**
 * Регистрирует график активности пользователей.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotUsersActivityPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/users/activity",
    tags: ["project-users"],
    summary: "Активные пользователи по времени",
    description:
      "Считает **уникальных людей**, что-то сделавших за каждый слот " +
      "(входящее сообщение или нажатие inline-кнопки, `message_type=user`). " +
      "Ответы бота не учитываются.\n\n" +
      "С `granularity` (1m|5m|1h|1w|1d|7d|30d):\n" +
      "- короткие окна (1m/5m/1h) — из `bot_messages`;\n" +
      "- длинные (1w/1d/7d/30d) — из `user_activity_daily` " +
      "(переживают очистку сообщений и удаление людей).\n\n" +
      "Поле `newcomers` — люди, у которых время первого появления " +
      "попадает в тот же слот; `returning = total − newcomers`.\n\n" +
      "`activeInWindow` / `newInWindow` — уникальные за **всё окно** " +
      "(сумма точек не равна итогу: один человек за три дня — один, не три).\n\n" +
      "**Клиент:** `use-users-activity`.\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/users/activity?granularity=1d&tokenId=7' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: BotUsersProjectIdParamsSchema,
      query: BotUsersActivityQuerySchema,
    },
    responses: {
      200: {
        description: "Точки слотов и итоги окна",
        content: {
          "application/json": {
            schema: UserActivityResponseSchema,
            example: BOT_USERS_ACTIVITY_EXAMPLE,
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
            example: { message: "Ошибка при получении активности пользователей" },
          },
        },
      },
    },
  });
}
