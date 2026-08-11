/**
 * @fileoverview OpenAPI: GET detail + POST stop рассылки.
 * @module server/swagger/paths/project-broadcasts-detail-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import { ProjectBroadcastsIdParamsSchema } from "../schemas/project-broadcasts";
import {
  BroadcastDetailResponseSchema,
  StopBroadcastResponseSchema,
} from "../schemas/project-broadcasts-detail";
import {
  BROADCAST_DETAIL_EXAMPLE,
  PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
  PROJECT_BROADCASTS_LIST_EXAMPLE,
} from "./project-broadcasts-examples";

/**
 * Регистрирует детали и остановку рассылки.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBroadcastsDetailPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/broadcasts/{broadcastId}",
    tags: ["project-broadcasts"],
    summary: "Детали рассылки",
    description:
      "Карточка рассылки + результаты с ошибками (`status ≠ sent`). " +
      "Чужой projectId → 403.\n\n" +
      "**Клиент:** `use-broadcast-detail`.\n\n" +
      "```bash\ncurl -s -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcasts/15'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBroadcastsIdParamsSchema,
    },
    responses: {
      200: {
        description: "Рассылка и ошибки доставки",
        content: {
          "application/json": {
            schema: BroadcastDetailResponseSchema,
            example: BROADCAST_DETAIL_EXAMPLE,
          },
        },
      },
      400: {
        description: "Неверные ID",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверный ID проекта или рассылки" },
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
        description: "Рассылка другого проекта / нет доступа",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Рассылка не принадлежит этому проекту" },
          },
        },
      },
      404: {
        description: "Не найдена",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Рассылка не найдена" },
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

  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/broadcasts/{broadcastId}/stop",
    tags: ["project-broadcasts"],
    summary: "Остановить рассылку",
    description:
      "Ставит флаг остановки очереди. Только для `status=running`.\n\n" +
      "**Клиент:** `use-stop-broadcast`.\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcasts/15/stop'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBroadcastsIdParamsSchema,
    },
    responses: {
      200: {
        description: "Рассылка остановлена",
        content: {
          "application/json": {
            schema: StopBroadcastResponseSchema,
            example: {
              broadcast: {
                ...PROJECT_BROADCASTS_LIST_EXAMPLE.broadcasts[0],
                status: "stopped",
              },
            },
          },
        },
      },
      400: {
        description: "Не запущена / неверные ID",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Рассылка не запущена" },
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
        description: "Чужой проект",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
          },
        },
      },
      404: {
        description: "Не найдена",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Рассылка не найдена" },
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
