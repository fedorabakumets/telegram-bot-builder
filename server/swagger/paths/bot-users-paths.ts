/**
 * @fileoverview OpenAPI paths: список/CRUD пользователей бота проекта (`project-users`)
 * @module server/swagger/paths/bot-users-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
  ValidationErrorSchema,
} from "../schemas/common";
import {
  BotUserRowSchema,
  BotUsersPageSchema,
  CreateBotUserRequestSchema,
  DeleteBotUserSuccessSchema,
  UpdateBotUserRequestSchema,
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

  const projectUserParams = z.object({
    /** ID проекта */
    projectId: z.string().openapi({ example: "42", description: "ID проекта" }),
    /** Telegram user_id (строка) */
    userId: z.string().openapi({ example: "123456789", description: "Telegram user_id" }),
  });

  const tokenIdQuery = z.object({
    /** ID токена бота (скоуп данных) */
    tokenId: z.string().optional().openapi({
      example: "7",
      description: "Токен бота. Без него резолвится через resolveEffectiveProjectTokenId.",
    }),
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
    tags: ["project-users"],
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
    tags: ["project-users"],
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

  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/users/{userId}",
    tags: ["project-users"],
    summary: "Один пользователь бота по projectId и userId",
    description:
      "Возвращает одну строку `bot_users` для пары (project_id, user_id, token_id). " +
      "`tokenId` в query — скоуп по токену бота (как в остальных users-эндпоинтах). " +
      "Используется карточкой пользователя в редакторе.",
    security: cookieSecurity,
    request: { params: projectUserParams, query: tokenIdQuery },
    responses: {
      200: {
        description: "Строка bot_users",
        content: { "application/json": { schema: BotUserRowSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа к проекту",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      404: {
        description: "Пользователь не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      503: {
        description: "Сервис не настроен (setupGuard)",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
      500: {
        description: "Ошибка БД",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/projects/{projectId}/users/{userId}",
    tags: ["project-users"],
    summary: "Обновить пользователя бота (статус активности)",
    description:
      "**UI:** смена статуса «активен / неактивен» в базе пользователей.\n\n" +
      "Обновляет `is_active` в `bot_users` и `last_interaction`. " +
      "`projectId` и `userId` — в path; `tokenId` — в query (`?tokenId=7`). " +
      "Резолв токена через `resolveEffectiveProjectTokenId`.\n\n" +
      "Заменяет legacy `PUT /api/users/{id}` с `projectId` в body.",
    security: cookieSecurity,
    request: {
      params: projectUserParams,
      query: tokenIdQuery,
      body: {
        required: true,
        content: {
          "application/json": {
            schema: UpdateBotUserRequestSchema,
            examples: {
              activate: {
                summary: "Активировать пользователя",
                value: { isActive: 1 },
              },
              deactivate: {
                summary: "Деактивировать пользователя",
                value: { isActive: 0 },
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Обновлённая строка bot_users",
        content: { "application/json": { schema: BotUserRowSchema } },
      },
      400: {
        description: "Нет полей для обновления",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет доступа к проекту",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      404: {
        description: "Пользователь не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      503: {
        description: "Сервис не настроен (setupGuard)",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
      500: {
        description: "Ошибка БД",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/projects/{projectId}/users/{userId}",
    tags: ["project-users"],
    summary: "Удалить пользователя и его сообщения",
    description:
      "**UI:** удаление пользователя из базы в редакторе.\n\n" +
      "Удаляет все сообщения из `bot_messages` и строку из `bot_users` " +
      "для (user_id, project_id, token_id). `tokenId` — в query.\n\n" +
      "Заменяет legacy `DELETE /api/users/{id}` с `projectId` в body. " +
      "Не путать с `DELETE /api/projects/{id}/users` — массовое удаление всех пользователей проекта.",
    security: cookieSecurity,
    request: { params: projectUserParams, query: tokenIdQuery },
    responses: {
      200: {
        description: "Успешное удаление",
        content: {
          "application/json": {
            schema: DeleteBotUserSuccessSchema,
            example: { message: "User data deleted successfully" },
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
      404: {
        description: "Пользователь не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      503: {
        description: "Сервис не настроен (setupGuard)",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
      500: {
        description: "Ошибка БД",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });
}
