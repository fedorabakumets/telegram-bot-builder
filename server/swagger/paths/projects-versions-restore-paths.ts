/**
 * @fileoverview OpenAPI: POST …/versions/{versionId}/restore.
 * @module server/swagger/paths/projects-versions-restore-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { BotProjectSchema, ProjectsCookiesSchema } from "../schemas/projects";
import { VersionsProjectVersionParamsSchema } from "../schemas/project-versions";
import { BOT_PROJECT_EXAMPLE } from "./projects-examples";

/**
 * Регистрирует откат проекта к версии (UI-путь).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsVersionsRestorePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/versions/{versionId}/restore",
    tags: ["project-versions"],
    summary: "Откатить проект к версии",
    description:
      "Пишет `version.snapshot` в `project.data`, sync `_content`, Redis " +
      "`bot:table_updated`. Тело не требуется.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** VersionsPanel / `useRestoreProjectVersion`.\n\n" +
      "**MCP:** этот URL **не** вызывает — читает GET snapshot и делает " +
      "`PUT /api/projects/{id}` (live + новый чекпоинт отката).\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/versions/7/restore \\\n" +
      "  -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: VersionsProjectVersionParamsSchema,
    },
    responses: {
      200: {
        description: "Обновлённый проект после отката",
        content: {
          "application/json": {
            schema: BotProjectSchema,
            example: BOT_PROJECT_EXAMPLE,
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
        description: "Версия или проект не найдены",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Версия не найдена" },
          },
        },
      },
      500: {
        description: "Сбой отката",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось восстановить версию проекта" },
          },
        },
      },
    },
  });
}
