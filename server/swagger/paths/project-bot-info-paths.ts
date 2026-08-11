/**
 * @fileoverview OpenAPI: GET bot/info и bot/data.
 * @module server/swagger/paths/project-bot-info-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  ProjectBotDataSchema,
  ProjectBotInfoSchema,
  ProjectBotProjectIdParamsSchema,
  ProjectBotTokenQuerySchema,
} from "../schemas/project-bot";
import {
  PROJECT_BOT_DATA_EXAMPLE,
  PROJECT_BOT_FORBIDDEN_EXAMPLE,
  PROJECT_BOT_INFO_EXAMPLE,
} from "./project-bot-examples";

/**
 * Регистрирует getMe и данные бота для UI диалогов.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBotInfoPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/bot/info",
    tags: ["project-bot"],
    summary: "Профиль бота (getMe)",
    description:
      "Telegram getMe для токена проекта (`tokenId` или default). " +
      "`photoUrl: true` — фото есть (клиент грузит через avatar proxy). " +
      "Без токена: `{ hasToken: false }`.\n\n" +
      "Имя/описание менять через `PUT …/tokens/{tokenId}/bot-info`.\n\n" +
      "**Клиент:** `use-bot-queries` / карточки ботов.\n\n" +
      "```bash\ncurl -s -b cookies.txt 'http://localhost:5000/api/projects/42/bot/info?tokenId=7'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBotProjectIdParamsSchema,
      query: ProjectBotTokenQuerySchema,
    },
    responses: {
      200: {
        description: "getMe или hasToken:false",
        content: {
          "application/json": {
            schema: ProjectBotInfoSchema,
            example: PROJECT_BOT_INFO_EXAMPLE,
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

  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/bot/data",
    tags: ["project-bot"],
    summary: "Данные бота для диалогов",
    description:
      "Кэш профиля default-токена в формате, совместимом с bot_users " +
      "(аватар/username для панели Database → диалоги).\n\n" +
      "**Клиент:** `use-bot-data`.\n\n" +
      "```bash\ncurl -s -b cookies.txt 'http://localhost:5000/api/projects/42/bot/data'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBotProjectIdParamsSchema,
    },
    responses: {
      200: {
        description: "Профиль или null",
        content: {
          "application/json": {
            schema: ProjectBotDataSchema,
            example: PROJECT_BOT_DATA_EXAMPLE,
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
    },
  });
}
