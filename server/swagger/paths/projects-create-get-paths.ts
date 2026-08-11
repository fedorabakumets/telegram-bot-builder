/**
 * @fileoverview OpenAPI: POST /api/projects и GET /api/projects/{id}.
 * @module server/swagger/paths/projects-create-get-paths
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
  CreateProjectRequestSchema,
  CreateProjectUnauthorizedSchema,
  ProjectsCookiesSchema,
} from "../schemas/projects";
import {
  BOT_PROJECT_EXAMPLE,
  CREATE_PROJECT_BODY_EXAMPLE,
  CREATE_PROJECT_ERROR_EXAMPLE,
  CREATE_PROJECT_UNAUTHORIZED_EXAMPLE,
  CREATE_PROJECT_VALIDATION_EXAMPLE,
} from "./projects-examples";

/**
 * Регистрирует создание проекта и получение по ID.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerProjectsCreateGetPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/projects",
    tags: ["projects"],
    summary: "Создать проект",
    description:
      "Создаёт проект для текущего пользователя. **`ownerId` берётся из сессии**, " +
      "поле в body игнорируется. После insert создаётся таблица `_content`, " +
      "шлётся live-событие `projects-changed`.\n\n" +
      "**Тело:** `name` обязателен; `data` — опциональный стартовый сценарий.\n\n" +
      "**Клиент:** home, сайдбар, NoProjectsScreen, импорт.\n\n" +
      "```bash\n" +
      "curl -s -X POST http://localhost:5000/api/projects -b cookies.txt \\\n" +
      "  -H 'Content-Type: application/json' \\\n" +
      "  -d '{\"name\":\"Мой бот\"}'\n" +
      "```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      body: {
        content: {
          "application/json": {
            schema: CreateProjectRequestSchema,
            example: CREATE_PROJECT_BODY_EXAMPLE,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Проект создан",
        content: {
          "application/json": {
            schema: BotProjectSchema,
            example: BOT_PROJECT_EXAMPLE,
          },
        },
      },
      400: {
        description: "Ошибка валидации Zod",
        content: {
          "application/json": {
            schema: ValidationErrorSchema,
            example: CREATE_PROJECT_VALIDATION_EXAMPLE,
          },
        },
      },
      401: {
        description: "Гость без Telegram-сессии (ownerId === null)",
        content: {
          "application/json": {
            schema: CreateProjectUnauthorizedSchema,
            example: CREATE_PROJECT_UNAUTHORIZED_EXAMPLE,
          },
        },
      },
      500: {
        description: "Ошибка БД / создания",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: CREATE_PROJECT_ERROR_EXAMPLE,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}",
    tags: ["projects"],
    summary: "Получить проект по ID",
    description:
      "Полная запись проекта (включая `data` сценария). Доступ: владелец или " +
      "collaborator (`requireProjectAccess`).\n\n" +
      "**Параметры:** path `id` — числовой ID проекта.\n\n" +
      "**Клиент:** редактор (`use-project-loader`), сохранение, MCP.\n\n" +
      "```bash\ncurl -s http://localhost:5000/api/projects/42 -b cookies.txt\n```",
    security: cookieSecurity,
    request: {
      cookies: ProjectsCookiesSchema,
      params: z.object({
        /** ID проекта */
        id: z.string().openapi({
          example: "42",
          description: "Числовой ID проекта",
          param: { description: "Числовой ID проекта", example: "42" },
        }),
      }),
    },
    responses: {
      200: {
        description: "Данные проекта",
        content: {
          "application/json": {
            schema: BotProjectSchema,
            example: BOT_PROJECT_EXAMPLE,
          },
        },
      },
      400: {
        description: "id не число",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: {
              message: "Неверный ID проекта",
              error: "ID проекта должен быть числом",
            },
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
      404: {
        description: "Проект не найден или нет доступа",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Проект не найден" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Не удалось получить проект" },
          },
        },
      },
    },
  });
}
