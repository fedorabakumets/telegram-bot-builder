/**
 * @fileoverview OpenAPI: POST /api/projects/{id}/generate.
 * @module server/swagger/paths/projects-generate-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import {
  GenerateCodeErrorSchema,
  GenerateCodeRequestSchema,
  GenerateCodeResponseSchema,
  ProjectCodeIdParamsSchema,
} from "../schemas/project-code";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  GENERATE_BODY_EXAMPLE,
  GENERATE_FAILED_EXAMPLE,
  GENERATE_NOT_FOUND_EXAMPLE,
  GENERATE_OK_EXAMPLE,
} from "./projects-generate-examples";

/**
 * Регистрирует полную генерацию Python-кода (Code panel).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsGeneratePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/generate",
    tags: ["projects"],
    summary: "Сгенерировать Python-код бота (полный)",
    description:
      "Собирает сценарий проекта в Python. На сервере подтягиваются флаги " +
      "первого токена (`catchAllHandlers`, `protectContent`, `contentCache`) и " +
      "кэшированные Telegram `file_id` / обложки медиа из `/uploads/`.\n\n" +
      "**Тело:** `{ userDatabaseEnabled?, enableLogging? }` — остальное не из body.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** Code panel (`use-code-generator`, mode=server).\n\n" +
      "Проще экспорт без media/file_ids — `POST …/export`.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/generate -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"userDatabaseEnabled\":true,\"enableLogging\":false}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectCodeIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: GenerateCodeRequestSchema,
            example: GENERATE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Код, число строк и timestamp",
        content: {
          "application/json": {
            schema: GenerateCodeResponseSchema,
            example: GENERATE_OK_EXAMPLE,
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
            schema: GenerateCodeErrorSchema,
            example: GENERATE_NOT_FOUND_EXAMPLE,
          },
        },
      },
      500: {
        description: "Сбой генератора",
        content: {
          "application/json": {
            schema: GenerateCodeErrorSchema,
            example: GENERATE_FAILED_EXAMPLE,
          },
        },
      },
    },
  });
}
