/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/messages/activity.
 * @module server/swagger/paths/project-messages-activity-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { MessageActivityListSchema } from "../schemas/project-messages-dto";
import {
  ProjectMessagesActivityQuerySchema,
  ProjectMessagesProjectIdParamsSchema,
} from "../schemas/project-messages-params";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  PROJECT_MESSAGES_ACTIVITY_EXAMPLE,
  PROJECT_MESSAGES_ACTIVITY_SPLIT_EXAMPLE,
  PROJECT_MESSAGES_FORBIDDEN_EXAMPLE,
} from "./project-messages-examples";

/**
 * Регистрирует график активности сообщений.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectMessagesActivityPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/messages/activity",
    tags: ["project-messages"],
    summary: "Активность сообщений по времени",
    description:
      "С `granularity` (1m|5m|1h|1d|7d|30d): короткие окна — `bot_messages` + " +
      "`generate_series` (fill gaps); дневные — `message_activity_daily`. " +
      "Без granularity — legacy `period` (7d|30d|90d, default 30d) через " +
      "`queryActivityFromDailyPeriod`.\n\n" +
      '`split=true` → `[{date, incoming, outgoing}]`, иначе `[{date, count}]`.\n\n' +
      "**Auth:** `requireApiAuth` + `requireProjectAccess` (cookie / Bearer PAT).\n\n" +
      "**Клиент:** `use-messages-activity` → Analytics/Stats.\n\n" +
      "```bash\n" +
      "curl -s 'http://localhost:5000/api/projects/42/messages/activity" +
      "?granularity=1h&split=true&tokenId=7' \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectMessagesProjectIdParamsSchema,
      query: ProjectMessagesActivityQuerySchema,
    },
    responses: {
      200: {
        description: "Ряд точек активности",
        content: {
          "application/json": {
            schema: MessageActivityListSchema,
            examples: {
              count: {
                summary: "Без split",
                value: PROJECT_MESSAGES_ACTIVITY_EXAMPLE,
              },
              split: {
                summary: "split=true",
                value: PROJECT_MESSAGES_ACTIVITY_SPLIT_EXAMPLE,
              },
            },
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
            example: PROJECT_MESSAGES_FORBIDDEN_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: {
              message: "Ошибка при получении данных активности сообщений",
            },
          },
        },
      },
    },
  });
}
