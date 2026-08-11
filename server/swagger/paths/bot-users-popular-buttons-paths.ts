/**
 * @fileoverview OpenAPI: GET /users/popular-buttons.
 * @module server/swagger/paths/bot-users-popular-buttons-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  PopularButtonsListSchema,
  PopularButtonsQuerySchema,
} from "../schemas/bot-users-analytics";
import { BotUsersProjectIdParamsSchema } from "../schemas/bot-users-params";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  BOT_USERS_FORBIDDEN_EXAMPLE,
  BOT_USERS_POPULAR_BUTTONS_EXAMPLE,
} from "./bot-users-examples";

/**
 * Регистрирует топ популярных inline-кнопок.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerBotUsersPopularButtonsPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/users/popular-buttons",
    tags: ["project-users"],
    summary: "Топ-10 популярных inline-кнопок",
    description:
      "Нажатия из `bot_messages` (`message_type=user`, " +
      "`message_data.button_clicked=true`). Label — `button_text` или " +
      "`callback_data`. Окно по `granularity` (default как 1d → 30 days).\n\n" +
      "**Клиент:** `use-popular-buttons`.\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/users/popular-buttons?granularity=1d&tokenId=7' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: BotUsersProjectIdParamsSchema,
      query: PopularButtonsQuerySchema,
    },
    responses: {
      200: {
        description: "До 10 элементов [{ label, count }]",
        content: {
          "application/json": {
            schema: PopularButtonsListSchema,
            example: BOT_USERS_POPULAR_BUTTONS_EXAMPLE,
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
            example: { message: "Ошибка при получении популярных кнопок" },
          },
        },
      },
    },
  });
}
