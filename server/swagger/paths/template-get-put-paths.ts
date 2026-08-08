/**
 * @fileoverview OpenAPI paths: GET/PUT `/api/templates/{id}`.
 * @module server/swagger/paths/template-get-put-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import {
  TemplateIdParamsSchema,
  UpdateTemplateRequestSchema,
} from "../schemas/template-bodies";
import { BotTemplateDtoSchema, TemplateValidationErrorSchema } from "../schemas/templates";

/**
 * Регистрирует GET и PUT одного сценария.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerTemplateGetPutPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/templates/{id}",
    tags: ["templates"],
    summary: "Сценарий по ID",
    description:
      "Один шаблон из `bot_templates`.\n\n" +
      "**Статус:** marketplace/legacy — **текущий UI «Сценарии» не вызывает** " +
      "(карточки берут данные из list/featured/category).\n\n" +
      "**Доступ (`canViewOrUseTemplate`):** системный, публичный или свой. " +
      "Чужой private → **403**.\n\n" +
      "**Отдаёт:** сырой шаблон **без** алиаса `flow_data`.",
    security: cookieSecurity,
    request: { params: TemplateIdParamsSchema },
    responses: {
      200: {
        description: "Шаблон найден",
        content: { "application/json": { schema: BotTemplateDtoSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Чужой шаблон",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: { message: "You don't have permission to access this template" },
          },
        },
      },
      404: {
        description: "Не найден",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Template not found" },
          },
        },
      },
      500: {
        description: "Ошибка БД",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      503: {
        description: "setupGuard / БД не готова",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/templates/{id}",
    tags: ["templates"],
    summary: "Обновить сценарий",
    description:
      "Частичное обновление (клиентская схема без featured/счётчиков).\n\n" +
      "**Статус:** marketplace/legacy — **текущий UI не использует**.\n\n" +
      "**Права:** только свой шаблон (`ownerId === caller`). Системные и чужие → 403.\n" +
      "**Не принимает:** `featured`, rating/счётчики, `ownerId`.",
    security: cookieSecurity,
    request: {
      params: TemplateIdParamsSchema,
      body: {
        content: { "application/json": { schema: UpdateTemplateRequestSchema } },
      },
    },
    responses: {
      200: {
        description: "Обновлённый шаблон",
        content: { "application/json": { schema: BotTemplateDtoSchema } },
      },
      400: {
        description: "Ошибка Zod",
        content: { "application/json": { schema: TemplateValidationErrorSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Нет прав (чужой или системный)",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      404: {
        description: "Не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      500: {
        description: "Ошибка обновления",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });
}
