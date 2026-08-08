/**
 * @fileoverview OpenAPI paths: featured и category `/api/templates`.
 * @module server/swagger/paths/template-featured-category-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { BotTemplateListSchema } from "../schemas/templates";
import { TEMPLATE_LIST_ITEM_EXAMPLE } from "./template-examples";

/**
 * Регистрирует GET featured и GET category.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerTemplateFeaturedCategoryPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "get",
    path: "/api/templates/featured",
    tags: ["templates"],
    summary: "Рекомендуемые сценарии",
    description:
      "Шаблоны с `featured=1`.\n\n" +
      "**Зачем:** вкладка «Рекомендуемые» на странице «Сценарии».\n\n" +
      "**Фильтр privacy:** `isPublic === 1` **или** `ownerId === null` (системные) **или** " +
      "свой (`ownerId` сессии).\n\n" +
      "**Не отдаёт:** чужие приватные featured.\n\n" +
      "**Авторизация:** cookie / PAT. **Клиент:** `useRekomenduemyeStsenary` " +
      "(запрос при активной вкладке featured).",
    security: cookieSecurity,
    responses: {
      200: {
        description: "Рекомендуемые после privacy-фильтра",
        content: {
          "application/json": {
            schema: BotTemplateListSchema,
            examples: {
              featured: { summary: "Один featured", value: [TEMPLATE_LIST_ITEM_EXAMPLE] },
            },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to fetch featured templates" },
          },
        },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/templates/category/{category}",
    tags: ["templates"],
    summary: "Сценарии по категории",
    description:
      "Фильтр по `category`. Особый случай **`custom`** = «Мои».\n\n" +
      "**custom:** только шаблоны текущего пользователя с `category=custom` " +
      "(`getUserBotTemplates`). Query `ids` **удалён** (был IDOR).\n\n" +
      "**Прочие категории:** только `isPublic=1` или `ownerId=null`.\n\n" +
      "**Клиент:** `useMoiStsenary` → `/category/custom` (требует сессию).",
    security: cookieSecurity,
    request: {
      params: z.object({
        category: z.string().openapi({
          example: "custom",
          description:
            "Категория: custom | business | entertainment | education | utility | game | official | community",
          param: {
            description:
              "Категория: custom | business | entertainment | education | utility | game | official | community",
            example: "custom",
          },
        }),
      }),
    },
    responses: {
      200: {
        description: "Массив шаблонов категории",
        content: { "application/json": { schema: BotTemplateListSchema } },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      500: {
        description: "Ошибка БД",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to fetch templates by category" },
          },
        },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });
}
