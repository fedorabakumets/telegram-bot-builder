/**
 * @fileoverview OpenAPI path: POST `/api/templates/{id}/use`.
 * @module server/swagger/paths/template-use-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import {
  TemplateIdParamsSchema,
  UseTemplateAuthResponseSchema,
  UseTemplateGuestResponseSchema,
} from "../schemas/template-bodies";
import { USE_TEMPLATE_AUTH_EXAMPLE } from "./template-examples";

/**
 * Регистрирует «использовать сценарий» (проект + копия в custom).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerTemplateUsePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/templates/{id}/use",
    tags: ["templates"],
    summary: "Создать проект из сценария",
    description:
      "Применяет шаблон: инкремент `useCount` + (для авторизованного) новый проект и копия в «Мои».\n\n" +
      "**Зачем:** кнопка «Использовать» на карточке сценария.\n\n" +
      "**Авторизованный (`ownerId` из сессии):**\n" +
      "1. `incrementTemplateUseCount`\n" +
      "2. `createBotProject` с `name`/`description`/`data` шаблона, `userDatabaseEnabled: 1`\n" +
      "3. Копия шаблона: `category: 'custom'`, **`isPublic: 0`**, `ownerId` = **оригинальный** " +
      "owner шаблона (системный остаётся `null`)\n" +
      "4. Ответ: `{ message, project, copiedTemplate }`\n\n" +
      "**Без ownerId (legacy guest):** только инкремент счётчика → " +
      "`{ message: \"Template use count incremented\" }`. " +
      "При deny-by-default обычно недоступно.\n\n" +
      "**Клиент:** `useIspolzovatStsenary`.",
    security: cookieSecurity,
    request: { params: TemplateIdParamsSchema },
    responses: {
      200: {
        description: "Проект и/или инкремент useCount",
        content: {
          "application/json": {
            schema: UseTemplateAuthResponseSchema.or(UseTemplateGuestResponseSchema),
            examples: {
              authenticated: {
                summary: "Авторизованный: проект + копия",
                value: USE_TEMPLATE_AUTH_EXAMPLE,
              },
              guest: {
                summary: "Legacy guest: только счётчик",
                value: { message: "Template use count incremented" },
              },
            },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      404: {
        description: "Шаблон не найден",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Template not found" },
          },
        },
      },
      500: {
        description: "Ошибка создания проекта/копии",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Failed to use template" },
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
