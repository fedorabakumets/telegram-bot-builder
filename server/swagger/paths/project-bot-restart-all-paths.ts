/**
 * @fileoverview OpenAPI: POST restart-all.
 * @module server/swagger/paths/project-bot-restart-all-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  ProjectBotIdParamsSchema,
  ProjectBotRestartAllOkSchema,
} from "../schemas/project-bot";
import {
  PROJECT_BOT_FORBIDDEN_EXAMPLE,
  PROJECT_BOT_RESTART_ALL_EXAMPLE,
} from "./project-bot-examples";

/**
 * Регистрирует массовый перезапуск running-ботов.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBotRestartAllPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/bot/restart-all",
    tags: ["project-bot"],
    summary: "Перезапустить всех running ботов",
    description:
      "Останавливает все running-токены проекта, cooldown, затем start со stagger. " +
      "Офлайн не трогает (для них — start-offline-all).\n\n" +
      "**Клиент/MCP:** `restartAllBotsMutation`, `db_restart_all_bots`.\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt 'http://localhost:5000/api/projects/42/bot/restart-all'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBotIdParamsSchema,
    },
    responses: {
      200: {
        description: "Сводка перезапуска",
        content: {
          "application/json": {
            schema: ProjectBotRestartAllOkSchema,
            example: PROJECT_BOT_RESTART_ALL_EXAMPLE,
          },
        },
      },
      401: {
        description: "Нет session / PAT",
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
            example: PROJECT_BOT_FORBIDDEN_EXAMPLE,
          },
        },
      },
      404: {
        description: "Нет токенов",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Токены проекта не найдены" },
          },
        },
      },
    },
  });
}
