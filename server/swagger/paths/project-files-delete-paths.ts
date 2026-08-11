/**
 * @fileoverview OpenAPI: DELETE /api/projects/{projectId}/files.
 * @module server/swagger/paths/project-files-delete-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  ProjectFilesDeleteRequestSchema,
  ProjectFilesDeleteResponseSchema,
  ProjectFilesProjectIdParamsSchema,
} from "../schemas/project-files";
import {
  PROJECT_FILES_DELETE_BODY_EXAMPLE,
  PROJECT_FILES_DELETE_OK_EXAMPLE,
  PROJECT_FILES_FORBIDDEN_EXAMPLE,
} from "./project-files-examples";

/**
 * Регистрирует удаление файлов проекта.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectFilesDeletePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/projects/{projectId}/files",
    tags: ["project-files"],
    summary: "Удалить файлы проекта",
    description:
      "Массовое удаление из «Файлы». Предпочтительно `{ items: [{ id, source }] }` " +
      "(вкладка «Все»). Легаси: `{ ids, source }` (`source` ≠ all). " +
      "`uploaded` — media_files+диск; incoming/outgoing — bot_messages.\n\n" +
      "**Клиент:** `use-file-delete-mutation`.\n\n" +
      "```bash\ncurl -s -X DELETE -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"items\":[{\"id\":88,\"source\":\"uploaded\"}]}' \\\n" +
      "  'http://localhost:5000/api/projects/42/files'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectFilesProjectIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: ProjectFilesDeleteRequestSchema,
            example: PROJECT_FILES_DELETE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Сколько записей удалено",
        content: {
          "application/json": {
            schema: ProjectFilesDeleteResponseSchema,
            example: PROJECT_FILES_DELETE_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Пустой/неверный body",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: {
              message: "source обязателен: incoming | outgoing | uploaded (не all)",
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
