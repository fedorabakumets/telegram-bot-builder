/**
 * @fileoverview OpenAPI: GET /api/projects/{projectId}/collaborators.
 * @module server/swagger/paths/projects-collaborators-info-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  CollaboratorInfoListSchema,
  CollaboratorsInfoParamsSchema,
} from "../schemas/project-collaborators-info";
import { ProjectsCookiesSchema } from "../schemas/projects";

/** Пример ответа Files UI */
const COLLABORATORS_INFO_EXAMPLE = [
  {
    userId: 123456789,
    name: "Иван Иванов",
    photoUrl: "https://t.me/i/userpic/320/example.jpg",
  },
  {
    userId: 987654321,
    name: "@collaborator",
    photoUrl: null,
  },
];

/**
 * Регистрирует read-only список участников для панели Files.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsCollaboratorsInfoPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/collaborators",
    tags: ["projects"],
    summary: "Участники проекта (владелец + коллабораторы)",
    description:
      "Read-only список для Files UI: владелец и приглашённые с именем и " +
      "аватаркой, без дублей. Не путать с CRUD `/api/bot/projects/{id}/collaborators`.\n\n" +
      "**Параметры:** path `projectId`. Auth — cookie / Bearer PAT + " +
      "`requireProjectAccess`.\n\n" +
      "**Клиент:** `use-project-collaborators` — фильтр «Сотрудник», колонка аватара.\n\n" +
      "```bash\n" +
      "curl -s http://localhost:5000/api/projects/42/collaborators -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: CollaboratorsInfoParamsSchema,
    },
    responses: {
      200: {
        description: "Массив CollaboratorInfo (может быть пустым)",
        content: {
          "application/json": {
            schema: CollaboratorInfoListSchema,
            examples: {
              withMembers: {
                summary: "Есть участники",
                value: COLLABORATORS_INFO_EXAMPLE,
              },
              empty: { summary: "Пусто", value: [] },
            },
          },
        },
      },
      400: {
        description: "projectId не число",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверный projectId" },
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
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось получить коллабораторов" },
          },
        },
      },
    },
  });
}
