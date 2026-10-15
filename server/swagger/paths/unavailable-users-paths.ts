/**
 * @fileoverview OpenAPI: GET /users/unavailable.
 * @module server/swagger/paths/unavailable-users-paths
 */
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsAuthHeadersSchema, ProjectsCookiesSchema } from "../schemas/projects";
import {
  UnavailableUsersPageSchema,
  UnavailableUsersParamsSchema,
  UnavailableUsersQuerySchema,
} from "../schemas/unavailable-users";

/**
 * Регистрирует список людей с удалённым аккаунтом или блокировкой бота.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerUnavailableUsersPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/users/unavailable",
    tags: ["project-users"],
    summary: "Удалённые и заблокировавшие бота",
    description: "Люди выбранного бота с is_deleted или is_blocked. Telegram не вызывается, текст сообщений не возвращается.",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: UnavailableUsersParamsSchema,
      query: UnavailableUsersQuerySchema,
    },
    responses: {
      200: { description: "Страница людей", content: { "application/json": { schema: UnavailableUsersPageSchema } } },
      400: { description: "Нет бота или неверная страница", content: { "application/json": { schema: MessageErrorSchema } } },
      401: { description: "Нет авторизации", content: { "application/json": { schema: UnauthorizedSchema } } },
      403: { description: "Нет доступа к проекту", content: { "application/json": { schema: MessageErrorSchema } } },
      404: { description: "Бот не принадлежит проекту", content: { "application/json": { schema: MessageErrorSchema } } },
    },
  });
}
