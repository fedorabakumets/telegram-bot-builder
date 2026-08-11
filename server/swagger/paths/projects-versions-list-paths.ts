/**
 * @fileoverview OpenAPI: GET /api/projects/{id}/versions (тег project-versions).
 * @module server/swagger/paths/projects-versions-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  ProjectVersionListSchema,
  ProjectsCookiesSchema,
} from "../schemas/projects";

/** Path id */
const ProjectIdParamsSchema = z.object({
  /** Числовой ID проекта */
  id: z.string().openapi({
    example: "42",
    description: "Числовой ID проекта",
    param: { description: "Числовой ID проекта", example: "42" },
  }),
});

/** Пример списка версий */
const VERSIONS_LIST_EXAMPLE = [
  {
    id: 7,
    projectId: 42,
    label: "Добавил приветствие",
    authorId: 123456789,
    authorName: "Иван @ivan",
    authorKind: null,
    kind: "manual",
    createdAt: "2026-08-11T12:00:00.000Z",
  },
  {
    id: 6,
    projectId: 42,
    label: null,
    authorId: null,
    authorName: "ИИ-агент",
    authorKind: "agent",
    kind: "auto",
    createdAt: "2026-08-11T11:30:00.000Z",
  },
];

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
      "Метаданные снимков для истории и отката. Поле `snapshot` не включается. " +
      "`authorName` — из Telegram или «ИИ-агент» при `authorKind=agent`.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** панель версий.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/projects/42/versions -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectIdParamsSchema,
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
