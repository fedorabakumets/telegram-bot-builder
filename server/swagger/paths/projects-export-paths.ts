/**
 * @fileoverview OpenAPI: POST /api/projects/{id}/export.
 * @module server/swagger/paths/projects-export-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  ExportCodeErrorSchema,
  ExportCodeResponseSchema,
  ProjectCodeIdParamsSchema,
} from "../schemas/project-code";
import { ProjectsCookiesSchema } from "../schemas/projects";

/** Успешный ответ */
const EXPORT_OK_EXAMPLE = {
  code: "import asyncio\nfrom aiogram import Bot, Dispatcher\n# ...\n",
};

/**
 * Регистрирует простой экспорт Python-кода (MCP `db_export_project`).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsExportPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/export",
    tags: ["projects"],
    summary: "Экспорт Python-кода бота (простой)",
    description:
      "Генерирует код без кэша media `file_id` и без флагов токена. " +
      "`userDatabaseEnabled` берётся из проекта (`=== 1`). Тело запроса не нужно.\n\n" +
      "**Ответ:** `{ code }` — строка Python.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** MCP `db_export_project` (`exportProjectInDb`). " +
      "Полная генерация с media — `POST …/generate`.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/export -b cookies.txt\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectCodeIdParamsSchema,
    },
    responses: {
      200: {
        description: "Сгенерированный код",
        content: {
          "application/json": {
            schema: ExportCodeResponseSchema,
            example: EXPORT_OK_EXAMPLE,
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
            schema: ExportCodeErrorSchema,
            example: { message: "Проект не найден" },
          },
        },
      },
      500: {
        description: "Ошибка генерации",
        content: {
          "application/json": {
            schema: ExportCodeErrorSchema,
            example: {
              message: "Не удалось сгенерировать код",
              error: "Error: ...",
            },
          },
        },
      },
    },
  });
}
