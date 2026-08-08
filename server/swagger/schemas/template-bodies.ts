/**
 * @fileoverview OpenAPI-схемы тел запросов и ответов `/api/templates`.
 * Create/Update без featured, счётчиков и ownerId (mass-assignment закрыт).
 * @module server/swagger/schemas/template-bodies
 */

import "./common";
import { z } from "zod";
import { BotProjectSchema } from "./projects";
import { BotTemplateDtoSchema } from "./templates";

/** Категории сценария */
const TemplateCategoryEnum = z.enum([
  "custom",
  "business",
  "entertainment",
  "education",
  "utility",
  "game",
  "official",
  "community",
]);

/** Тело POST /api/templates — без featured/rating/счётчиков/ownerId */
export const CreateTemplateRequestSchema = z
  .object({
    name: z.string().min(1).openapi({ example: "Мой FAQ" }),
    description: z.string().nullable().optional().openapi({
      example: "Сохранено из редактора",
    }),
    data: z.unknown().openapi({
      example: { sheets: [{ id: "main", nodes: [], edges: [] }] },
    }),
    category: TemplateCategoryEnum.optional().default("custom").openapi({
      example: "custom",
    }),
    tags: z.array(z.string()).optional().openapi({ example: [] }),
    isPublic: z.number().min(0).max(1).optional().default(0).openapi({ example: 0 }),
    difficulty: z.enum(["easy", "medium", "hard"]).optional().default("easy"),
    authorId: z.string().nullable().optional(),
    authorName: z.string().nullable().optional().openapi({ example: "ivan" }),
    version: z.string().optional(),
    previewImage: z.string().nullable().optional(),
    language: z
      .enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"])
      .optional()
      .default("ru"),
    requiresToken: z.number().min(0).max(1).optional().default(0),
    complexity: z.number().min(1).max(10).optional().default(1),
    estimatedTime: z.number().min(1).max(120).optional().default(5),
  })
  .openapi("CreateTemplateRequest");

/** Тело PUT /api/templates/{id} — частичное, без privileged fields */
export const UpdateTemplateRequestSchema = CreateTemplateRequestSchema.partial().openapi(
  "UpdateTemplateRequest",
);

/** Path-параметр id сценария */
export const TemplateIdParamsSchema = z.object({
  id: z.string().openapi({ example: "12", description: "ID bot_templates" }),
});

/** Query GET /api/templates/search */
export const TemplateSearchQuerySchema = z.object({
  q: z.string().openapi({ example: "faq", description: "Строка поиска" }),
});

/** Успех POST …/use */
export const UseTemplateAuthResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Template copied to your projects and collection",
    }),
    project: BotProjectSchema,
    copiedTemplate: BotTemplateDtoSchema,
  })
  .openapi("UseTemplateAuthResponse");
