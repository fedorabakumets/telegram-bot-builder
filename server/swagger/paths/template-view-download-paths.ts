/**
 * @fileoverview OpenAPI paths: view / download (marketplace legacy).
 * @module server/swagger/paths/template-view-download-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import { TemplateIdParamsSchema } from "../schemas/template-bodies";
import { TemplateMessageSchema } from "../schemas/templates";

const LEGACY =
  "**Статус:** marketplace/legacy — **текущий UI «Сценарии» не вызывает**. " +
  "Серверные хендлеры есть; счётчики в `bot_templates` обновляются.";

/**
 * Регистрирует view/download инкременты.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerTemplateViewDownloadPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  const auth503 = {
    401: {
      description: "Не авторизован",
      content: { "application/json": { schema: UnauthorizedSchema } },
    },
    503: {
      description: "Приложение не настроено",
      content: { "application/json": { schema: SetupRequiredSchema } },
    },
  };

  registry.registerPath({
    method: "post",
    path: "/api/templates/{id}/view",
    tags: ["templates"],
    summary: "Инкремент просмотров",
    description: `${LEGACY}\n\nБез тела. \`incrementTemplateViewCount\`.`,
    security: cookieSecurity,
    request: { params: TemplateIdParamsSchema },
    responses: {
      200: {
        description: "viewCount++",
        content: {
          "application/json": {
            schema: TemplateMessageSchema,
            example: { message: "View count incremented" },
          },
        },
      },
      404: {
        description: "Не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      500: {
        description: "Ошибка",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      ...auth503,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/templates/{id}/download",
    tags: ["templates"],
    summary: "Инкремент скачиваний",
    description: `${LEGACY}\n\nБез тела. \`incrementTemplateDownloadCount\`. Файл не отдаёт.`,
    security: cookieSecurity,
    request: { params: TemplateIdParamsSchema },
    responses: {
      200: {
        description: "downloadCount++",
        content: {
          "application/json": {
            schema: TemplateMessageSchema,
            example: { message: "Download count incremented" },
          },
        },
      },
      404: {
        description: "Не найден",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      500: {
        description: "Ошибка",
        content: { "application/json": { schema: MessageErrorSchema } },
      },
      ...auth503,
    },
  });
}
