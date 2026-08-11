/**
 * @fileoverview OpenAPI: GET/POST /broadcasts.
 * @module server/swagger/paths/project-broadcasts-list-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema, UnauthorizedSchema, ValidationErrorSchema } from "../schemas/common";
import { ProjectsCookiesSchema, ProjectsAuthHeadersSchema } from "../schemas/projects";
import {
  BroadcastsListResponseSchema,
  CreateBroadcastRequestSchema,
  CreateBroadcastResponseSchema,
  ProjectBroadcastsListQuerySchema,
  ProjectBroadcastsProjectIdParamsSchema,
} from "../schemas/project-broadcasts";
import {
  CREATE_BROADCAST_BODY_EXAMPLE,
  CREATE_BROADCAST_RESPONSE_EXAMPLE,
  PROJECT_BROADCASTS_FORBIDDEN_EXAMPLE,
  PROJECT_BROADCASTS_LIST_EXAMPLE,
} from "./project-broadcasts-examples";

/**
 * Регистрирует список и создание рассылок.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectBroadcastsListPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/projects/{projectId}/broadcasts",
    tags: ["project-broadcasts"],
    summary: "Список рассылок проекта",
    description:
      "История рассылок (Broadcast panel) с пагинацией. `tokenId` фильтрует по боту.\n\n" +
      "**Auth:** cookie или Bearer PAT + доступ к проекту. **Клиент:** `use-broadcasts`.\n\n" +
      "```bash\ncurl -s -b cookies.txt \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcasts?page=1&tokenId=7'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBroadcastsProjectIdParamsSchema,
      query: ProjectBroadcastsListQuerySchema,
    },
    responses: {
      200: {
        description: "Страница рассылок",
        content: {
          "application/json": {
            schema: BroadcastsListResponseSchema,
            example: PROJECT_BROADCASTS_LIST_EXAMPLE,
          },
        },
      },
      400: {
        description: "Неверный projectId",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Неверный ID проекта" },
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

  registry.registerPath({
    method: "post",
    path: "/api/projects/{projectId}/broadcasts",
    tags: ["project-broadcasts"],
    summary: "Создать и запустить рассылку",
    description:
      "Создаёт рассылку со статусом `running` и запускает очередь отправки. " +
      "`tokenId` — query или body; иначе default токен. Текст ≤4096, media ≤10, buttons ≤100.\n\n" +
      "**Клиент:** `use-create-broadcast`.\n\n" +
      "```bash\ncurl -s -X POST -b cookies.txt -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"name\":\"Акция\",\"messageText\":\"Привет!\",\"filters\":{}}' \\\n" +
      "  'http://localhost:5000/api/projects/42/broadcasts?tokenId=7'\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      headers: ProjectsAuthHeadersSchema,
      params: ProjectBroadcastsProjectIdParamsSchema,
      query: ProjectBroadcastsListQuerySchema.pick({ tokenId: true }),
      body: {
        content: {
          "application/json": {
            schema: CreateBroadcastRequestSchema,
            example: CREATE_BROADCAST_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Рассылка создана и запущена",
        content: {
          "application/json": {
            schema: CreateBroadcastResponseSchema,
            example: CREATE_BROADCAST_RESPONSE_EXAMPLE,
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
