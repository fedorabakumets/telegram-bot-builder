/**
 * @fileoverview OpenAPI paths для projects (список, обновление, удаление, версии)
 * @module server/swagger/paths/projects-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ForbiddenSchema, MessageErrorSchema, UnauthorizedSchema, ValidationErrorSchema } from "../schemas/common";
import {
  BotProjectSchema,
  DeleteProjectResponseSchema,
  DuplicateProjectRequestSchema,
  ProjectListItemSchema,
  ProjectListSchema,
  ProjectVersionListSchema,
  UpdateProjectRequestSchema,
} from "../schemas/projects";

/**
 * Регистрирует детальные OpenAPI paths управления проектами.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Security requirement для session cookie / PAT
 * @returns void
 */
export function registerProjectsPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const projectIdParam = z.object({
    /** ID проекта */
    id: z.string().openapi({ example: "42", description: "ID проекта" }),
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/list",
    tags: ["projects"],
    summary: "Список проектов пользователя",
    description:
      "Возвращает метаданные проектов владельца без секретов (botToken, sessionId). " +
      "Включает nodeCount и sheetsCount, вычисленные из data.",
    security: cookieSecurity,
    responses: {
      200: {
        description: "Массив проектов",
        content: { "application/json": { schema: ProjectListSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/projects/{id}",
    tags: ["projects"],
    summary: "Обновить проект",
    description:
      "Частичное обновление полей проекта. При изменении data создаётся снимок версии. " +
      "Поля commitMessage, agentEdit — для истории версий и live-редактирования MCP.",
    security: cookieSecurity,
    request: {
      params: projectIdParam,
      body: { content: { "application/json": { schema: UpdateProjectRequestSchema } } },
    },
    responses: {
      200: {
        description: "Обновлённый проект",
        content: { "application/json": { schema: BotProjectSchema } },
      },
      400: {
        description: "Невалидный id или тело запроса",
        content: { "application/json": { schema: ValidationErrorSchema } },
      },
      404: {
        description: "Проект не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/projects/{id}",
    tags: ["projects"],
    summary: "Удалить проект",
    description:
      "Останавливает бота, удаляет токены, медиа, user data и сам проект. " +
      "Требует прав владельца или collaborator.",
    security: cookieSecurity,
    request: { params: projectIdParam },
    responses: {
      200: {
        description: "Проект удалён",
        content: { "application/json": { schema: DeleteProjectResponseSchema } },
      },
      403: {
        description: "Нет прав на удаление",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      404: {
        description: "Проект не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/duplicate",
    tags: ["projects"],
    summary: "Дублировать проект",
    description:
      "Создаёт копию сценария без botToken (два бота не могут делить токен). " +
      "Ответ — безопасный ProjectListItem.",
    security: cookieSecurity,
    request: {
      params: projectIdParam,
      body: { content: { "application/json": { schema: DuplicateProjectRequestSchema } } },
    },
    responses: {
      201: {
        description: "Копия создана",
        content: { "application/json": { schema: ProjectListItemSchema } },
      },
      401: {
        description: "Гость без авторизации",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      404: {
        description: "Проект-источник не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/versions",
    tags: ["projects"],
    summary: "Список версий проекта",
    description: "Метаданные снимков для истории и отката. Поле snapshot не включается.",
    security: cookieSecurity,
    request: { params: projectIdParam },
    responses: {
      200: {
        description: "Массив версий",
        content: { "application/json": { schema: ProjectVersionListSchema } },
      },
      400: {
        description: "Невалидный ID проекта",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
    },
  });
}
