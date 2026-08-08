/**
 * @fileoverview OpenAPI path: DELETE `/api/templates/{id}`.
 * @module server/swagger/paths/template-delete-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  ForbiddenSchema,
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { TemplateIdParamsSchema } from "../schemas/template-bodies";
import { TemplateMessageSchema } from "../schemas/templates";

/**
 * Регистрирует удаление своего сценария.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerTemplateDeletePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "delete",
    path: "/api/templates/{id}",
    tags: ["templates"],
    summary: "Удалить свой сценарий",
    description:
      "Удаляет запись `bot_templates`.\n\n" +
      "**Зачем:** кнопка удаления на вкладке «Мои».\n\n" +
      "**Права:** при авторизации — только свой; системные не удаляются (403).\n\n" +
      "**Отдаёт:** `{ message: \"Template deleted successfully\" }`.\n\n" +
      "**Клиент:** `useUdalitStsenary`.",
    security: cookieSecurity,
    request: { params: TemplateIdParamsSchema },
    responses: {
      200: {
        description: "Удалён",
        content: {
          "application/json": {
            schema: TemplateMessageSchema,
            example: { message: "Template deleted successfully" },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      403: {
        description: "Чужой или системный",
        content: { "application/json": { schema: ForbiddenSchema } },
      },
      404: {
        description: "Не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      500: {
        description: "Ошибка удаления",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });
}
