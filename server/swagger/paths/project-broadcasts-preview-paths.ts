/**
 * @fileoverview OpenAPI: POST …/preview-audience.
 * @module server/swagger/paths/project-broadcasts-preview-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema, ValidationErrorSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  PreviewAudienceRequestSchema,
  PreviewAudienceResponseSchema,
  ProjectBroadcastsListQuerySchema,
  ProjectBroadcastsProjectIdParamsSchema,
} from "../schemas/project-broadcasts";
import {
  PREVIEW_AUDIENCE_BODY_EXAMPLE,
  PREVIEW_AUDIENCE_RESPONSE_EXAMPLE,
  PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
} from "./project-broadcasts-examples";

/**
 * Регистрирует предпросмотр аудитории рассылки.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBroadcastsPreviewPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/broadcasts/preview-audience",
    tags: ["project-broadcasts"],
    summary: "Предпросмотр аудитории рассылки",
    description:
      "Считает получателей по `filters` (+ до 3 примеров). `tokenId` — query/body. " +
      "Не создаёт рассылку.\n\n" +
      "**Клиент:** `use-audience-preview`.\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"filters\":{\"tags\":[\"vip\"]}}' \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcasts/preview-audience?tokenId=7'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBroadcastsProjectIdParamsSchema,
      query: ProjectBroadcastsListQuerySchema.pick({ tokenId: true }),
      body: {
        content: {
          "application/json": {
            schema: PreviewAudienceRequestSchema,
            example: PREVIEW_AUDIENCE_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Количество и sample",
        content: {
          "application/json": {
            schema: PreviewAudienceResponseSchema,
            example: PREVIEW_AUDIENCE_RESPONSE_EXAMPLE,
          },
        },
      },
      400: {
        description: "Валидация / нет токена",
        content: {
          "application/json": {
            schema: ValidationErrorSchema,
            example: { message: "Неверное тело запроса", errors: [] },
          },
        },
      },
      401: {
        description: "Нет session / PAT",
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
            example: PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      500: {
        description: "Внутренняя ошибка",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Внутренняя ошибка сервера" },
          },
        },
      },
    },
  });
}
