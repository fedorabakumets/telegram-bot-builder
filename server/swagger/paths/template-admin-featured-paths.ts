/**
 * @fileoverview OpenAPI: PATCH `/admin/api/templates/{id}/featured`.
 * @module server/swagger/paths/template-admin-featured-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { MessageErrorSchema } from "../schemas/common";
import { BotTemplateDtoSchema } from "../schemas/templates";
import { TemplateIdParamsSchema } from "../schemas/template-bodies";

const adminSecurity = [{ adminCookie: [] as string[] }];

/** Тело смены featured */
const AdminFeaturedBodySchema = z
  .object({
    featured: z.union([z.literal(0), z.literal(1)]).openapi({ example: 1 }),
  })
  .openapi("AdminSetTemplateFeaturedRequest");

/**
 * Регистрирует admin-only смену featured.
 * @param registry - Реестр zod-to-openapi
 * @returns void
 */
export function registerAdminTemplateFeaturedPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "patch",
    path: "/admin/api/templates/{id}/featured",
    tags: ["admin"],
    summary: "Пометить сценарий как featured (или снять)",
    description:
      "Только admin cookie. Обычный `PUT /api/templates/{id}` поле `featured` игнорирует.",
    security: adminSecurity,
    request: {
      params: TemplateIdParamsSchema,
      body: {
        content: {
          "application/json": {
            schema: AdminFeaturedBodySchema,
            example: { featured: 1 },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Шаблон обновлён",
        content: {
          "application/json": {
            schema: BotTemplateDtoSchema,
          },
        },
      },
      400: {
        description: "Неверный id или featured",
        content: {
          "application/json": {
            schema: MessageErrorSchema,
            example: { message: "featured must be 0 or 1" },
          },
        },
      },
      401: {
        description: "Нет admin-сессии",
        content: {
          "application/json": {
            schema: z.object({ error: z.string() }),
            example: { error: "ADMIN_UNAUTHORIZED" },
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
    },
  });
}
