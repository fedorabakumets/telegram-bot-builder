/**
 * @fileoverview OpenAPI path: GET `/api/templates/search`.
 * @module server/swagger/paths/template-search-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { TemplateSearchQuerySchema } from "../schemas/template-bodies";
import { BotTemplateListSchema } from "../schemas/templates";

/**
 * Регистрирует поиск сценариев.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerTemplateSearchPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/templates/search",
    tags: ["templates"],
    summary: "Поиск сценариев",
    description:
      "Поиск по строке `q`.\n\n" +
      "**Статус:** marketplace/legacy — **текущий UI не вызывает** " +
      "(нет поисковой строки на «Сценарии»).\n\n" +
      "**Query:** `q` обязателен (иначе 400).\n\n" +
      "**Privacy:** публичные + системные (`ownerId=null`) + свои.",
    security: cookieSecurity,
    request: { query: TemplateSearchQuerySchema },
    responses: {
      200: {
        description: "Найденные шаблоны",
        content: { "application/json": { schema: BotTemplateListSchema } },
      },
      400: {
        description: "Нет q",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Search query is required" },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      500: {
        description: "Ошибка поиска",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });
}
