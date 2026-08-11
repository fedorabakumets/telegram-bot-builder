/**
 * @fileoverview OpenAPI: POST /api/projects/{id}/versions/commit.
 * @module server/swagger/paths/projects-versions-commit-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  ProjectVersionFullSchema,
  VersionCommitRequestSchema,
  VersionsProjectIdParamsSchema,
} from "../schemas/project-versions";
import {
  VERSION_COMMIT_BODY_EXAMPLE,
  VERSION_FULL_EXAMPLE,
} from "./projects-versions-examples";

/**
 * Регистрирует ручной чекпоинт (kind=manual).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsVersionsCommitPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/versions/commit",
    tags: ["project-versions"],
    summary: "Создать ручной чекпоинт версии",
    description:
      "Снимок **текущего** `project.data` с `kind=manual`. Всегда создаётся " +
      "(без дедупликации). Broadcast `versions-changed`.\n\n" +
      "**Тело:** `{ message }` — непустая строка после trim.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** CommitForm / `useCreateProjectCommit`. MCP-тула commit нет.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/versions/commit \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"message\":\"Добавил приветствие\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: VersionsProjectIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: VersionCommitRequestSchema,
            example: VERSION_COMMIT_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Созданная версия (со snapshot)",
        content: {
          "application/json": {
            schema: ProjectVersionFullSchema,
            example: VERSION_FULL_EXAMPLE,
          },
        },
      },
      400: {
        description: "Пустой message или невалидный id",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            examples: {
              emptyMessage: {
                summary: "Нет message",
                value: { message: "Сообщение чекпоинта обязательно" },
              },
              badId: {
                summary: "Плохой id",
                value: { message: "Неверный ID проекта" },
              },
            },
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
        description: "Проект не найден",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Проект не найден" },
          },
        },
      },
      500: {
        description: "Сбой создания чекпоинта",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось создать чекпоинт" },
          },
        },
      },
    },
  });
}
