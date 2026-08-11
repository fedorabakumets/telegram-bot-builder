/**
 * @fileoverview OpenAPI: GET /api/projects/{projectId}/files.
 * @module server/swagger/paths/project-files-get-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  ProjectFilesListQuerySchema,
  ProjectFilesListResponseSchema,
  ProjectFilesProjectIdParamsSchema,
} from "../schemas/project-files";
import {
  PROJECT_FILES_FORBIDDEN_EXAMPLE,
  PROJECT_FILES_LIST_EXAMPLE,
} from "./project-files-examples";

/**
 * Регистрирует список файлов проекта.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectFilesGetPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/files",
    tags: ["project-files"],
    summary: "Список файлов проекта",
    description:
      "Таблица «Файлы»: `uploaded` / входящие / исходящие / `all`. " +
      "Фильтры: имя, даты, тип, сотрудник, размер, хранилище, `tokenId`. " +
      "Пагинация `page`/`limit`.\n\n" +
      "**Auth:** cookie или Bearer PAT + доступ к проекту. **Клиент:** `use-project-files`.\n\n" +
      "```bash\ncurl -s -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/files?category=uploaded&page=1'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectFilesProjectIdParamsSchema,
      query: ProjectFilesListQuerySchema,
    },
    responses: {
      200: {
        description: "Страница файлов",
        content: {
          "application/json": {
            schema: ProjectFilesListResponseSchema,
            example: PROJECT_FILES_LIST_EXAMPLE,
          },
        },
      },
      400: {
        description: "Нет/неверный category",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: {
              message: "Параметр category обязателен: all | incoming | outgoing | uploaded",
            },
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
            example: PROJECT_FILES_FORBIDDEN_EXAMPLE,
          },
        },
      },
    },
  });
}
