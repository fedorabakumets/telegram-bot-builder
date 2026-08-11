/**
 * @fileoverview OpenAPI: POST …/bot/restart.
 * @module server/swagger/paths/project-bot-restart-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  ProjectBotIdParamsSchema,
  ProjectBotStartOkSchema,
  ProjectBotTokenBodySchema,
} from "../schemas/project-bot";
import { PROJECT_BOT_FORBIDDEN_EXAMPLE } from "./project-bot-examples";

/**
 * Регистрирует перезапуск одного бота.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBotRestartPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/bot/restart",
    tags: ["project-bot"],
    summary: "Перезапустить бота",
    description:
      "Stop → cooldown → start. С `tokenId` — конкретный бот; без — legacy " +
      "(инстанс + default). **MCP:** `db_restart_bot`.\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"tokenId\":7}' 'http://localhost:5000/api/projects/42/bot/restart'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBotIdParamsSchema,
      body: {
        content: { "application/json": { schema: ProjectBotTokenBodySchema } },
      },
    },
    responses: {
      200: {
        description: "Перезапущен",
        content: {
          "application/json": {
            schema: ProjectBotStartOkSchema,
            example: { message: "Бот успешно перезапущен", processId: "12345" },
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
        description: "Нет доступа / чужой tokenId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_BOT_FORBIDDEN_EXAMPLE,
          },
        },
      },
    },
  });
}
