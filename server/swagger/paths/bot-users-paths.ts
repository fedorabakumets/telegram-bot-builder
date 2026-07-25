/**
 * @fileoverview OpenAPI paths: список диалогов и создание пользователя бота
 * @module server/swagger/paths/bot-users-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
  ValidationErrorSchema,
} from "../schemas/common";
import {
  BotUserRowSchema,
  BotUsersPageSchema,
  CreateBotUserRequestSchema,
} from "../schemas/bot-users";

/**
 * Регистрирует детальные paths GET/POST /api/projects/{id}/users
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security cookie / PAT
 * @returns void
 */
export function registerBotUsersPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const projectIdParam = z.object({
    /** ID проекта */
    id: z.string().openapi({ example: "42", description: "ID проекта" }),
  });

  const listQuery = z.object({
    /** ID токена бота (скоуп данных) */
    tokenId: z.string().optional().openapi({
      example: "7",
      description: "Фильтр по токену бота. Без него — все токены проекта (где применимо).",
    }),
    /** Размер страницы; без limit — legacy-массив без пагинации */
    limit: z.string().optional().openapi({ example: "50", description: "Лимит записей (пагинация)" }),
    /** Смещение для пагинации */
    offset: z.string().optional().openapi({ example: "0" }),
    /** Поиск по имени, username, user_id или тексту сообщений */
    search: z.string().optional().openapi({ example: "иван" }),
    /** Фильтр активности: true | false */
    filterActive: z.enum(["true", "false"]).optional(),
    /** Поле сортировки (whitelist на сервере) */
    sortBy: z.string().optional().openapi({ example: "lastInteraction" }),
    /** Направление сортировки */
    sortDir: z.enum(["asc", "desc"]).optional().openapi({ example: "desc" }),
    /**
     * Тип диалогов для вкладки «Диалоги».
     * all — личные + группы + каналы; users — только люди;
     * groups — group/supergroup; channels — только каналы.
     * Имеет приоритет над includeGroups.
     */
    dialogKind: z
      .enum(["all", "users", "groups", "channels"])
      .optional()
      .openapi({ example: "all" }),
    /** Legacy: включить группы в список (эквивалент dialogKind=all) */
    includeGroups: z.enum(["true", "false"]).optional().openapi({ example: "true" }),
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/users",
    tags: ["projects"],
    summary: "Список пользователей и диалогов проекта",
    description:
      "Вкладка «Диалоги» / «Пользователи». С `limit` — страница `{ users, total, hasMore }`. " +
      "Без `limit` — плоский массив (обратная совместимость). " +
      "`dialogKind` фильтрует личные / группы / каналы на сервере.",
    security: cookieSecurity,
    request: { params: projectIdParam, query: listQuery },
    responses: {
      200: {
        description: "Пагинированный список или массив пользователей",
        content: { "application/json": { schema: BotUsersPageSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа к проекту",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/users",
    tags: ["projects"],
    summary: "Создать или обновить пользователя бота",
    description:
      "INSERT в `bot_users` по (user_id, project_id, token_id). " +
      "При конфликте обновляет `last_interaction` (upsert). " +
      "`tokenId` — в query или в теле; иначе подставляется 0.",
    security: cookieSecurity,
    request: {
      params: projectIdParam,
      query: z.object({
        tokenId: z.string().optional().openapi({
          example: "7",
          description: "ID токена бота (альтернатива полю в body)",
        }),
      }),
      body: {
        required: true,
        content: { "application/json": { schema: CreateBotUserRequestSchema } },
      },
    },
    responses: {
      201: {
        description: "Пользователь создан или обновлён (строка bot_users)",
        content: { "application/json": { schema: BotUserRowSchema } },
      },
      400: {
        description: "Нет userId или невалидные данные",
        content: {
          "application/json": {
            schema: z.union([MessageErrorSchema, ValidationErrorSchema]),
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа к проекту",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      500: {
        description: "Ошибка БД",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });
}
