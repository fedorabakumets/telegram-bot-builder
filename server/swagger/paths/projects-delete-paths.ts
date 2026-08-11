/**
 * @fileoverview OpenAPI: DELETE /api/projects/{id}.
 * @module server/swagger/paths/projects-delete-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import {
  DeleteProjectResponseSchema,
  ProjectsCookiesSchema, ProjectsAuthHeadersSchema,
} from "../schemas/projects";
import {
  DELETE_PROJECT_FORBIDDEN_EXAMPLE,
  DELETE_PROJECT_OK_EXAMPLE,
} from "./projects-mutate-examples";

/** Path id */
const ProjectIdParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
});

/**
 * Регистрирует удаление проекта.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsDeletePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/projects/{id}",
    tags: ["projects"],
    summary: "Удалить проект",
    description:
      "Останавливает бота, удаляет токены, медиа, user data и проект. " +
      "Шлёт `projects-changed` (deleted) членам команды.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess` " +
      "(владелец или collaborator).\n\n" +
      "**Клиент:** сайдбар / удаление проекта.\n\n" +
      "```bash\n" +
      "curl -s -X DELETE http://localhost:5000/api/projects/42 -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectIdParamsSchema,
    },
    responses: {
      200: {
        description: "Проект удалён",
        content: {
          "application/json": {
            schema: DeleteProjectResponseSchema,
            example: DELETE_PROJECT_OK_EXAMPLE,
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
        description: "Нет прав на удаление",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: DELETE_PROJECT_FORBIDDEN_EXAMPLE,
          },
        },
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
      500: {
        description: "Сбой очистки связанных данных",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось удалить проект" },
          },
        },
      },
    },
  });
}
