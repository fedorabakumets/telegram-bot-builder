/**
 * @fileoverview OpenAPI: PATCH /admin/api/templates/{id}/featured.
 * @module server/swagger/paths/template-admin-featured-paths
 */

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { MessageErrorSchema } from "../schemas/common";
import { BotTemplateDtoSchema } from "../schemas/templates";
import { TemplateIdParamsSchema } from "../schemas/template-bodies";
import {
  ADMIN_SECURITY,
  AdminCookiesSchema,
  AdminUnauthorizedSchema,
} from "../schemas/admin-common";
import { TEMPLATE_LIST_ITEM_EXAMPLE } from "./template-examples";
import {
  ADMIN_CURL_LOGIN,
  ADMIN_FEATURED_BODY_EXAMPLE,
  ADMIN_UNAUTHORIZED_EXAMPLE,
} from "./admin-examples";
import { z } from "zod";

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
      "Выставляет `featured` 0|1. Обычный `PUT /api/templates/{id}` это поле **игнорирует**.\n\n" +
      "**Path:** `id` — ID `bot_templates`.\n\n" +
      "```bash\n" +
      `${ADMIN_CURL_LOGIN}\n` +
      "curl -s -X PATCH http://localhost:5000/admin/api/templates/12/featured -b admin.txt \\\n" +
      "  -H 'Content-Type: application/json' -d '{\"featured\":1}'\n" +
      "```",
    security: ADMIN_SECURITY,
    request: {
      cookies: AdminCookiesSchema,
      params: TemplateIdParamsSchema,
      body: {
        required: true,
        content: {
          "application/json": {
            schema: AdminFeaturedBodySchema,
            example: ADMIN_FEATURED_BODY_EXAMPLE,
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
            example: { ...TEMPLATE_LIST_ITEM_EXAMPLE, featured: 1 },
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
            schema: AdminUnauthorizedSchema,
            example: ADMIN_UNAUTHORIZED_EXAMPLE,
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
