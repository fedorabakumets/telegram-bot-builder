/**
 * @fileoverview OpenAPI path: POST `/api/templates/{id}/use`.
 * @module server/swagger/paths/template-use-paths
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
  UseTemplateAuthResponseSchema,
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
      "Применяет шаблон: инкремент `useCount` + новый проект + private-копия в «Мои».\n\n" +
      "**Доступ (`canViewOrUseTemplate`):** системный (`ownerId=null`), публичный " +
      "(`isPublic=1`) или **свой**. Чужой private → **403** (IDOR закрыт).\n\n" +
      "1. `incrementTemplateUseCount`\n" +
      "2. `createBotProject` с data шаблона, `ownerId` = текущий user\n" +
      "3. Копия: `category: custom`, `isPublic: 0`, **`ownerId` = текущий user**\n\n" +
      "**Клиент:** `useIspolzovatStsenary`.",
    security: cookieSecurity,
    request: { params: TemplateIdParamsSchema },
    responses: {
      200: {
        description: "Проект + копия в коллекции",
        content: {
          "application/json": {
            schema: UseTemplateAuthResponseSchema,
            example: USE_TEMPLATE_AUTH_EXAMPLE,
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Чужой приватный шаблон",
        content: {
          "application/json": {
            schema: ForbiddenSchema,
            example: { message: "You don't have permission to use this template" },
          },
        },
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
