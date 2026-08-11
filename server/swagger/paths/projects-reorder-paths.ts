/**
 * @fileoverview OpenAPI: PUT /api/projects/reorder.
 * @module server/swagger/paths/projects-reorder-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import {
  ProjectsCookiesSchema, ProjectsAuthHeadersSchema,
  ReorderProjectsRequestSchema,
  ReorderProjectsResponseSchema,
} from "../schemas/projects";

/** Пример тела запроса */
const REORDER_BODY_EXAMPLE = { projectIds: [42, 7, 15] };

/** Пример успеха */
const REORDER_OK_EXAMPLE = { success: true };

/**
 * Регистрирует переупорядочивание проектов в списке.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsReorderPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "put",
    path: "/api/projects/reorder",
    tags: ["projects"],
    summary: "Изменить порядок проектов в списке",
    description:
      "Задаёт `sortOrder` по порядку ID в теле. После успеха шлёт live-событие " +
      "`projects-changed` (reordered) владельцу.\n\n" +
      "**Тело:** `{ projectIds: number[] }` — непустой массив положительных целых. " +
      "Каждый ID должен быть доступен текущему пользователю (владелец или collaborator); " +
      "иначе **403** (защита от IDOR).\n\n" +
      "**Клиент:** drag-and-drop в сайдбаре, MCP `db_reorder_projects`.\n\n" +
      "```bash\n" +
      "curl -s -X PUT http://localhost:5000/api/projects/reorder -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"projectIds\":[42,7,15]}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      body: {
        content: {
          "application/json": {
            schema: ReorderProjectsRequestSchema,
            example: REORDER_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Порядок сохранён",
        content: {
          "application/json": {
            schema: ReorderProjectsResponseSchema,
            example: REORDER_OK_EXAMPLE,
          },
        },
      },
      400: {
        description: "Пустой или невалидный projectIds",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверный список projectIds" },
          },
        },
      },
      401: {
        description: "Нет session cookie и Bearer PAT / нет личности",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Требуется авторизация через Telegram" },
          },
        },
      },
      403: {
        description: "Нет доступа хотя бы к одному projectId",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: { message: "Нет прав на один или несколько проектов" },
          },
        },
      },
      500: {
        description: "Ошибка БД при сохранении порядка",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось переупорядочить проекты" },
          },
        },
      },
    },
  });
}
