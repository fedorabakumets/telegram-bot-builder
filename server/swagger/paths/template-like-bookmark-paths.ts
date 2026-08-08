/**
 * @fileoverview OpenAPI paths: like / bookmark (marketplace legacy).
 * @module server/swagger/paths/template-like-bookmark-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  MessageErrorSchema,
  SetupRequiredSchema,
  UnauthorizedSchema,
} from "../schemas/common";
import {
  BookmarkTemplateRequestSchema,
  LikeTemplateRequestSchema,
  TemplateIdParamsSchema,
} from "../schemas/template-bodies";
import { TemplateMessageSchema } from "../schemas/templates";

const LEGACY =
  "**Статус:** marketplace/legacy — **текущий UI «Сценарии» не вызывает**.";

/**
 * Регистрирует like и bookmark.
 * @param registry - Реестр zod-to-openapi
 * @param cookieSecurity - Session cookie / Bearer PAT
 * @returns void
 */
export function registerTemplateLikeBookmarkPaths(
  registry: OpenAPIRegistry,
  cookieSecurity: Array<Record<string, string[]>>,
): void {
  registry.registerPath({
    method: "post",
    path: "/api/templates/{id}/like",
    tags: ["templates"],
    summary: "Лайк / снять лайк",
    description: `${LEGACY}\n\n**Тело:** \`{ liked: boolean }\`.`,
    security: cookieSecurity,
    request: {
      params: TemplateIdParamsSchema,
      body: { content: { "application/json": { schema: LikeTemplateRequestSchema } } },
    },
    responses: {
      200: {
        description: "liked / unliked",
        content: {
          "application/json": {
            schema: TemplateMessageSchema,
            example: { message: "Template liked" },
          },
        },
      },
      400: {
        description: "liked не boolean",
        content: { "application/json": { schema: MessageErrorSchema } },
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

  registry.registerPath({
    method: "post",
    path: "/api/templates/{id}/bookmark",
    tags: ["templates"],
    summary: "Закладка / снять закладку",
    description: `${LEGACY}\n\n**Тело:** \`{ bookmarked: boolean }\`.`,
    security: cookieSecurity,
    request: {
      params: TemplateIdParamsSchema,
      body: { content: { "application/json": { schema: BookmarkTemplateRequestSchema } } },
    },
    responses: {
      200: {
        description: "bookmarked / unbookmarked",
        content: {
          "application/json": {
            schema: TemplateMessageSchema,
            example: { message: "Template bookmarked" },
          },
        },
      },
      400: {
        description: "bookmarked не boolean",
        content: { "application/json": { schema: MessageErrorSchema } },
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
