/**
 * @fileoverview OpenAPI: GET tokens / tokens/list.
 * @module server/swagger/paths/project-tokens-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import { ProjectTokensIdParamsSchema } from "../schemas/project-tokens-params";
import {
  BotTokenListItemSchema,
  PublicBotTokenSchema,
} from "../schemas/project-tokens-dto";
import {
  PROJECT_TOKENS_FORBIDDEN_EXAMPLE,
  PUBLIC_TOKEN_WITH_BOT_ID_EXAMPLE,
  TOKEN_LIST_ITEM_EXAMPLE,
} from "./project-tokens-examples";
import { registerProjectTokensFirstPaths } from "./project-tokens-first-paths";

/**
 * Регистрирует списки токенов проекта (+ first).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectTokensListPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/tokens",
    tags: ["project-tokens"],
    summary: "Список токенов (masked + botId)",
    description:
      "`toPublicBotToken` + `botId` (префикс до `:`). Секреты вырезаны.\n\n" +
      "**Auth:** опционально `getOwnerIdFromRequest` — если сессия/PAT есть, " +
      "проверяет `hasProjectAccess` (403/404); без auth всё равно отдаёт список.\n\n" +
      "**Клиент:** панель токенов проекта.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/projects/42/tokens -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensIdParamsSchema,
    },
    responses: {
      200: {
        description: "Массив публичных токенов",
        content: {
          "application/json": {
            schema: z.array(PublicBotTokenSchema),
            example: [PUBLIC_TOKEN_WITH_BOT_ID_EXAMPLE],
          },
        },
      },
      401: {
        description: "Глобальный requireApiAuth (если включён)",
        content: {
          "application/json": {
            schema: UnauthorizedSchema,
            example: { error: "UNAUTHORIZED" },
          },
        },
      },
      403: {
        description: "Нет доступа (только при наличии ownerId)",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_TOKENS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      404: {
        description: "Проект не найден (при auth)",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Project not found" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/tokens/list",
    tags: ["project-tokens"],
    summary: "Безопасный whitelist список токенов",
    description:
      "Только `BotTokenListItem` (без token и прочих секретов). MCP/агенты.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** MCP `db_list_bot_tokens` (не UI; UI — `GET …/tokens`).\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/projects/42/tokens/list -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectTokensIdParamsSchema,
    },
    responses: {
      200: {
        description: "Whitelist-массив",
        content: {
          "application/json": {
            schema: z.array(BotTokenListItemSchema),
            example: [TOKEN_LIST_ITEM_EXAMPLE],
          },
        },
      },
      400: {
        description: "Невалидный id",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
            example: { error: "Некорректный projectId" },
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
            example: { message: "Нет прав доступа к проекту" },
          },
        },
      },
    },
  });

  registerProjectTokensFirstPaths(registry, cookieSecurity);
}
