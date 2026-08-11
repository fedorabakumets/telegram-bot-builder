/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/versions.
 * @module server/swagger/paths/projects-versions-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectVersionListSchema, ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { VersionsProjectIdParamsSchema } from "../schemas/project-versions";
import { VERSIONS_LIST_EXAMPLE } from "./projects-versions-examples";

/**
 * Регистрирует список метаданных версий проекта.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsVersionsListPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/versions",
    tags: ["project-versions"],
    summary: "Список версий проекта",
    description:
      "Метаданные снимков **без** `snapshot` (экономия трафика). " +
      "`authorName` — из Telegram или «ИИ-агент» при `authorKind=agent`.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** VersionsPanel / `useProjectVersions`; MCP `db_list_versions`.\n\n" +
      "Полный снимок — `GET …/versions/{versionId}`.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/projects/42/versions -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: VersionsProjectIdParamsSchema,
    },
    responses: {
      200: {
        description: "Массив метаданных версий",
        content: {
          "application/json": {
            schema: ProjectVersionListSchema,
            examples: {
              withVersions: {
                summary: "Есть версии",
                value: VERSIONS_LIST_EXAMPLE,
              },
              empty: { summary: "Пусто", value: [] },
            },
          },
        },
      },
      400: {
        description: "Невалидный ID проекта",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверный ID проекта" },
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
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось получить версии проекта" },
          },
        },
      },
    },
  });
}
