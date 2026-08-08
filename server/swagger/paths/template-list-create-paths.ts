/**
 * @fileoverview OpenAPI paths: GET/POST `/api/templates`.
 * @module server/swagger/paths/template-list-create-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { CreateTemplateRequestSchema } from "../schemas/template-bodies";
import {
  BotTemplateDtoSchema,
  BotTemplateListSchema,
  TemplateValidationErrorSchema,
} from "../schemas/templates";
import { CREATE_TEMPLATE_EXAMPLE, TEMPLATE_LIST_ITEM_EXAMPLE } from "./template-examples";

/**
 * Регистрирует list + create библиотеки сценариев.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerTemplateListCreatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/templates",
    tags: ["templates"],
    summary: "Список системных и публичных сценариев",
    description:
      "Каталог готовых сценариев ботов (`bot_templates`).\n\n" +
      "**Зачем:** вкладка «Все» на странице «Сценарии».\n\n" +
      "**Отдаёт:** массив шаблонов. Фильтр: `ownerId === null` (системные) **или** " +
      "`isPublic === 1`. Личные приватные пользователя сюда **не** попадают " +
      "(они только в `GET …/category/custom`).\n\n" +
      "**Нюанс:** к каждому элементу добавляется `flow_data` (= `data`) для совместимости с UI.\n\n" +
      "**Не отдаёт:** чужие приватные сценарии.\n\n" +
      "**Авторизация:** cookie или Bearer PAT (`requireApiAuth`).\n\n" +
      "**Клиент:** `useVseStsenary`.",
    security: cookieSecurity,
    responses: {
      200: {
        description: "Системные + публичные сценарии",
        content: {
          "application/json": {
            schema: BotTemplateListSchema,
            examples: {
              catalog: {
                summary: "Системный FAQ",
                value: [TEMPLATE_LIST_ITEM_EXAMPLE],
              },
            },
          },
        },
      },
      401: {
        description: "Нет session cookie и Bearer PAT",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      500: {
        description: "Ошибка чтения БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to fetch templates" },
          },
        },
      },
      503: {
        description: "setupGuard / БД не готова",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/templates",
    tags: ["templates"],
    summary: "Сохранить проект как сценарий",
    description:
      "Создаёт запись в `bot_templates` из текущего проекта.\n\n" +
      "**Зачем:** «Сохранить сценарий» в шапке; «сохранить перед удалением» в delete-project-dialog.\n\n" +
      "**Тело:** `name`, `description`, `data`, `category`, `tags`, `isPublic` (0/1), …\n\n" +
      "**Не принимает с клиента:** `featured`, rating/счётчики, `ownerId` " +
      "(mass-assignment закрыт; `featured` всегда 0 на create).\n\n" +
      "`ownerId` ставится из сессии. **Клиент:** `save-template-modal`.",
    security: cookieSecurity,
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateTemplateRequestSchema,
            examples: {
              fromEditor: { summary: "Из save-template-modal", value: CREATE_TEMPLATE_EXAMPLE },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Сценарий создан",
        content: { "application/json": { schema: BotTemplateDtoSchema } },
      },
      400: {
        description: "Ошибка Zod (createBotTemplateBodySchema)",
        content: { "application/json": { schema: TemplateValidationErrorSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      500: {
        description: "Ошибка создания",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to create template" },
          },
        },
      },
      503: {
        description: "setupGuard / БД не готова",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });
}
