/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/versions/{versionId}.
 * @module server/swagger/paths/projects-versions-get-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  ProjectVersionFullSchema,
  VersionsProjectVersionParamsSchema,
} from "../schemas/project-versions";
import { VERSION_FULL_EXAMPLE } from "./projects-versions-examples";

/**
 * Регистрирует получение полной версии со snapshot.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsVersionsGetPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/versions/{versionId}",
    tags: ["project-versions"],
    summary: "Версия со snapshot",
    description:
      "Полная запись включая тяжёлый `snapshot` (`project.data`). " +
      "versionId должен принадлежать проекту, иначе 404.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** diff (`useProjectVersionSnapshot`); MCP restore читает " +
      "snapshot отсюда и пишет через `PUT /api/projects/{id}`.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/projects/42/versions/7 -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: VersionsProjectVersionParamsSchema,
    },
    responses: {
      200: {
        description: "Версия со snapshot",
        content: {
          "application/json": {
            schema: ProjectVersionFullSchema,
            example: VERSION_FULL_EXAMPLE,
          },
        },
      },
      400: {
        description: "Невалидный id / versionId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверный ID проекта или версии" },
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
      404: {
        description: "Версия не найдена или чужой projectId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Версия не найдена" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось получить версию проекта" },
          },
        },
      },
    },
  });
}
