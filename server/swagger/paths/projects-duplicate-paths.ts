/**
 * @fileoverview OpenAPI: POST /api/projects/{id}/duplicate.
 * @module server/swagger/paths/projects-duplicate-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { MessageErrorSchema } from "../schemas/common";
import {
  DuplicateProjectRequestSchema,
  ProjectListItemSchema,
  ProjectsCookiesSchema, ProjectsAuthHeadersSchema,
} from "../schemas/projects";
import { PROJECT_LIST_ITEM_EXAMPLE } from "./projects-examples";
import {
  DUPLICATE_PROJECT_BODY_EXAMPLE,
  DUPLICATE_UNAUTHORIZED_EXAMPLE,
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
 * Регистрирует дублирование проекта.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsDuplicatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/duplicate",
    tags: ["projects"],
    summary: "Дублировать проект",
    description:
      "Копия сценария без `botToken`. Имя из body или «{имя} (копия)». " +
      "Создаёт `_content`, шлёт `projects-changed` (created).\n\n" +
      "**Ответ:** безопасный `ProjectListItem` (без секретов).\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`; гость → 401.\n\n" +
      "**Клиент:** сайдбар / MCP `db_duplicate_project`.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/duplicate \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"name\":\"Мой бот (копия)\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: DuplicateProjectRequestSchema,
            example: DUPLICATE_PROJECT_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Копия создана",
        content: {
          "application/json": {
            schema: ProjectListItemSchema,
            example: PROJECT_LIST_ITEM_EXAMPLE,
          },
        },
      },
      401: {
        description: "Гость без Telegram-сессии",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: DUPLICATE_UNAUTHORIZED_EXAMPLE,
          },
        },
      },
      403: {
        description: "Нет доступа к проекту-источнику",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Нет прав доступа к проекту" },
          },
        },
      },
      404: {
        description: "Проект-источник не найден",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Проект-источник не найден" },
          },
        },
      },
      500: {
        description: "Ошибка создания копии",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось дублировать проект" },
          },
        },
      },
    },
  });
}
