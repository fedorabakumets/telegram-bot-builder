/**
 * @fileoverview OpenAPI: PUT /api/projects/{id}.
 * @module server/swagger/paths/projects-update-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  MessageErrorSchema,
  UnauthorizedSchema,
  ValidationErrorSchema,
} from "../schemas/common";
import {
  BotProjectSchema,
  ProjectsCookiesSchema,
  UpdateProjectRequestSchema,
} from "../schemas/projects";
import { BOT_PROJECT_EXAMPLE } from "./projects-examples";
import {
  UPDATE_PROJECT_BAD_ID_EXAMPLE,
  UPDATE_PROJECT_BODY_EXAMPLE,
  UPDATE_PROJECT_DATA_BODY_EXAMPLE,
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
 * Регистрирует обновление проекта.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsUpdatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/{id}",
    tags: ["projects"],
    summary: "Обновить проект",
    description:
      "Частичное обновление полей. При изменении `data` — синхронизация " +
      "`_content`, снимок версии, Redis `bot:table_updated`, canvas-sync.\n\n" +
      "**Тело:** partial `insertBotProject` + `commitMessage`, `agentEdit`, " +
      "`agentSessionId`, `agentDisplayName`, `restartOnUpdate`.\n\n" +
      "**Auth:** cookie / Bearer PAT + `requireProjectAccess`.\n\n" +
      "**Клиент:** редактор (save), MCP live-edit.\n\n" +
      "```bash\n" +
      "curl -s -X PUT http://localhost:5000/api/projects/42 -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"name\":\"Новое имя\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: ProjectIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: UpdateProjectRequestSchema,
            examples: {
              rename: {
                summary: "Переименование",
                value: UPDATE_PROJECT_BODY_EXAMPLE,
              },
              withCheckpoint: {
                summary: "Сценарий + commitMessage",
                value: UPDATE_PROJECT_DATA_BODY_EXAMPLE,
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Обновлённый проект",
        content: {
          "application/json": {
            schema: BotProjectSchema,
            example: BOT_PROJECT_EXAMPLE,
          },
        },
      },
      400: {
        description: "Невалидный id или тело (Zod)",
        content: {
          "application/json": {
            schema: ValidationErrorSchema,
            example: UPDATE_PROJECT_BAD_ID_EXAMPLE,
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
    },
  });
}
