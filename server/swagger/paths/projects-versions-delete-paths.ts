/**
 * @fileoverview OpenAPI: DELETE /api/projects/{id}/versions/{versionId}.
 * @module server/swagger/paths/projects-versions-delete-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import {
  VersionDeleteResponseSchema,
  VersionsProjectVersionParamsSchema,
} from "../schemas/project-versions";
import { VERSION_DELETE_OK_EXAMPLE } from "./projects-versions-examples";

/**
 * Регистрирует удаление одной версии (MCP).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsVersionsDeletePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/projects/{id}/versions/{versionId}",
    tags: ["project-versions"],
    summary: "Удалить одну версию",
    description:
      "Необратимо удаляет запись истории. Broadcast `versions-changed`.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** UI не вызывает. MCP `db_delete_version` / `deleteVersionInDb`.\n\n" +
      "```bash\n" +
      "curl -s -X DELETE http://localhost:5000/api/projects/42/versions/7 \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: VersionsProjectVersionParamsSchema,
    },
    responses: {
      200: {
        description: "Результат удаления",
        content: {
          "application/json": {
            schema: VersionDeleteResponseSchema,
            example: VERSION_DELETE_OK_EXAMPLE,
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
            example: { message: "Не удалось удалить версию проекта" },
          },
        },
      },
    },
  });
}
