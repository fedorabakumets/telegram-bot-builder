/**
 * @fileoverview OpenAPI paths для projects (update / delete / duplicate / versions)
 * @module server/swagger/paths/projects-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ForbiddenSchema, MessageErrorSchema, ValidationErrorSchema } from "../schemas/common";
import {
  BotProjectSchema,
  DeleteProjectResponseSchema,
  DuplicateProjectRequestSchema,
  ProjectListItemSchema,
  ProjectVersionListSchema,
  UpdateProjectRequestSchema,
} from "../schemas/projects";
import { BOT_PROJECT_EXAMPLE, PROJECT_LIST_ITEM_EXAMPLE } from "./projects-examples";

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
    method: "put",
    path: "/api/projects/{id}",
    tags: ["projects"],
    summary: "Обновить проект",
    description:
      "Частичное обновление полей проекта. При изменении data создаётся снимок версии. " +
      "Поля commitMessage, agentEdit — для истории версий и live-редактирования MCP.\n\n" +
      "```bash\n" +
      "curl -s -X PUT http://localhost:5000/api/projects/42 -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"name\":\"Новое имя\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      params: projectIdParam,
      body: { content: { "application/json": { schema: UpdateProjectRequestSchema } } },
    },
    responses: {
      200: {
        description: "Обновлённый проект",
        content: {
          "application/json": {
            schema: BotProjectSchema,
            example: BOT_PROJECT_EXAMPLE,
          },
        },
      },
      400: {
        description: "Невалидный id или тело запроса",
        content: { "application/json": { schema: ValidationErrorSchema } },
      },
      404: {
        description: "Проект не найден",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Проект не найден" },
          },
        },
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
        content: {
          "application/json": {
            schema: ProjectListItemSchema,
            example: PROJECT_LIST_ITEM_EXAMPLE,
          },
        },
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
