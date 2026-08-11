/**
 * @fileoverview OpenAPI: POST /api/projects/{id}/versions/prune.
 * @module server/swagger/paths/projects-versions-prune-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema } from "../schemas/projects";
import {
  VersionPruneRequestSchema,
  VersionPruneResponseSchema,
  VersionsProjectIdParamsSchema,
} from "../schemas/project-versions";
import {
  VERSION_PRUNE_BODY_EXAMPLE,
  VERSION_PRUNE_OK_EXAMPLE,
} from "./projects-versions-examples";

/**
 * Регистрирует массовую очистку истории версий (MCP).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsVersionsPrunePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/versions/prune",
    tags: ["project-versions"],
    summary: "Массово удалить версии (prune)",
    description:
      "Необратимая чистка по фильтру. Broadcast `versions-changed`.\n\n" +
      "**Тело (все поля опциональны):** `keep` — сколько последних оставить; " +
      "`kind` — `auto`|`manual`; `authorKind` — `agent`|`user`.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** UI нет. MCP `db_prune_versions`. Авто-prune при save " +
      "(keep≈30) — отдельный серверный путь, не этот API.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects/42/versions/prune \\\n" +
      "  -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"keep\":30,\"kind\":\"auto\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: VersionsProjectIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: VersionPruneRequestSchema,
            example: VERSION_PRUNE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Число удалённых версий",
        content: {
          "application/json": {
            schema: VersionPruneResponseSchema,
            example: VERSION_PRUNE_OK_EXAMPLE,
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
            example: { message: "Не удалось удалить версии проекта" },
          },
        },
      },
    },
  });
}
