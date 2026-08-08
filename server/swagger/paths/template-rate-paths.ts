/**
 * @fileoverview OpenAPI path: POST `/api/templates/{id}/rate`.
 * @module server/swagger/paths/template-rate-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { RateTemplateRequestSchema, TemplateIdParamsSchema } from "../schemas/template-bodies";
import { TemplateMessageSchema } from "../schemas/templates";

/**
 * Регистрирует оценку сценария (marketplace/legacy).
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerTemplateRatePaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/templates/{id}/rate",
    tags: ["templates"],
    summary: "Оценить сценарий (1–5)",
    description:
      "**Статус:** marketplace/legacy — **текущий UI «Сценарии» не вызывает**.\n\n" +
      "**Тело:** `{ rating: 1..5 }`. Иначе 400.",
    security: cookieSecurity,
    request: {
      params: TemplateIdParamsSchema,
      body: { content: { "application/json": { schema: RateTemplateRequestSchema } } },
    },
    responses: {
      200: {
        description: "Оценка принята",
        content: {
          "application/json": {
            schema: TemplateMessageSchema,
            example: { message: "Template rated successfully" },
          },
        },
      },
      400: {
        description: "rating вне 1–5",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "Rating must be between 1 and 5" },
          },
        },
      },
      401: {
        description: "Не авторизован",
        content: { "application/json": { schema: UnauthorizedSchema } },
      },
      404: {
        description: "Не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      500: {
        description: "Ошибка",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      503: {
        description: "Приложение не настроено",
        content: { "application/json": { schema: SetupRequiredSchema } },
      },
    },
  });
}
