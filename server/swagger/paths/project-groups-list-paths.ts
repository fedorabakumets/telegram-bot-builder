/**
 * @fileoverview OpenAPI: GET /groups + POST …/sync.
 * @module server/swagger/paths/project-groups-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  BotGroupListSchema,
  ProjectGroupsGroupParamsSchema,
  ProjectGroupsProjectIdParamsSchema,
  ProjectGroupsTokenQuerySchema,
  SyncGroupResponseSchema,
} from "../schemas/project-groups";
import {
  PROJECT_GROUPS_FORBIDDEN_EXAMPLE,
  PROJECT_GROUPS_LIST_EXAMPLE,
  PROJECT_GROUPS_SYNC_EXAMPLE,
} from "./project-groups-examples";

/**
 * Регистрирует список групп и sync из Telegram.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectGroupsListPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/groups",
    tags: ["project-groups"],
    summary: "Список Telegram-групп проекта",
    description:
      "Группы/каналы проекта (Database → группы, выбор аудитории рассылки). " +
      "С `?tokenId=` — только группы этого бота (из `bot_groups` и чаты из `bot_messages`). " +
      "Без `tokenId` — все группы проекта. Название и аватарка — через `…/sync`.\n\n" +
      "**Auth:** cookie или Bearer PAT + доступ к проекту. **Клиент:** `group-select`, `use-sync-groups`.\n\n" +
      "```bash\ncurl -s 'http://localhost:5000/api/projects/42/groups?tokenId=7' -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectGroupsProjectIdParamsSchema,
      query: ProjectGroupsTokenQuerySchema,
    },
    responses: {
      200: {
        description: "Массив групп",
        content: {
          "application/json": {
            schema: BotGroupListSchema,
            example: PROJECT_GROUPS_LIST_EXAMPLE,
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
            example: PROJECT_GROUPS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось получить группы" },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/groups/{groupId}/sync",
    tags: ["project-groups"],
    summary: "Синхронизировать группу из Telegram",
    description:
      "Актуализирует название, тип и аватарку через `getChat`. Нет записи — создаёт. " +
      "`tokenId` — бот для Telegram. **Клиент:** `use-sync-groups`.\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/groups/-1001234567890/sync?tokenId=7'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectGroupsGroupParamsSchema,
      query: ProjectGroupsTokenQuerySchema,
    },
    responses: {
      200: {
        description: "Группа обновлена или создана",
        content: {
          "application/json": {
            schema: SyncGroupResponseSchema,
            example: PROJECT_GROUPS_SYNC_EXAMPLE,
          },
        },
      },
      400: {
        description: "Нет токена или Telegram отклонил getChat",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Токен бота не найден" },
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
            example: PROJECT_GROUPS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      500: {
        description: "Внутренняя ошибка",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось синхронизировать группу" },
          },
        },
      },
    },
  });
}
