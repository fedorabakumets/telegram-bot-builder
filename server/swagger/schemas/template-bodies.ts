/**
 * @fileoverview OpenAPI-схемы тел запросов и ответов `/api/templates`.
 * @module server/swagger/schemas/template-bodies
 */

import "./common";
import { z } from "zod";
import { BotProjectSchema } from "./projects";
import { BotTemplateDtoSchema } from "./templates";

/** Категории insertBotTemplateSchema */
const TemplateCategoryEnum = z.enum([
  "custom",
  "business",
  "entertainment",
  "education",
  "utility",
  "games",
  "official",
  "community",
]);

/** Тело POST /api/templates (`ownerId` из body игнорируется — берётся из сессии) */
export const CreateTemplateRequestSchema = z
  .object({
    name: z.string().min(1).openapi({ example: "Мой FAQ" }),
    description: z.string().nullable().optional().openapi({
      example: "Сохранено из редактора",
    }),
    /** JSON проекта (nodes/edges/sheets) */
    data: z.unknown().openapi({
      example: { sheets: [{ id: "main", nodes: [], edges: [] }] },
    }),
    category: TemplateCategoryEnum.optional().default("custom").openapi({
      example: "custom",
    }),
    tags: z.array(z.string()).optional().openapi({ example: [] }),
    /** 0 приватный / 1 публичный; UI save-template-modal */
    isPublic: z.number().min(0).max(1).optional().default(0).openapi({ example: 0 }),
    difficulty: z.enum(["easy", "medium", "hard"]).optional().default("easy"),
    authorId: z.string().nullable().optional(),
    authorName: z.string().nullable().optional().openapi({ example: "ivan" }),
    version: z.string().optional(),
    previewImage: z.string().nullable().optional(),
    featured: z.number().min(0).max(1).optional().default(0),
    language: z
      .enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"])
      .optional()
      .default("ru"),
    requiresToken: z.number().min(0).max(1).optional().default(0),
    complexity: z.number().min(1).max(10).optional().default(1),
    estimatedTime: z.number().min(1).max(120).optional().default(5),
    rating: z.number().min(1).max(5).optional(),
  })
  .openapi("CreateTemplateRequest");

/** Тело PUT /api/templates/{id} — частичное */
export const UpdateTemplateRequestSchema = CreateTemplateRequestSchema.partial().openapi(
  "UpdateTemplateRequest",
);

/** Path-параметр id сценария */
export const TemplateIdParamsSchema = z.object({
  id: z.string().openapi({ example: "12", description: "ID bot_templates" }),
});

/** Query GET /api/templates/category/{category} */
export const TemplateCategoryQuerySchema = z.object({
  /** Через запятую: для гостевой ветки custom (legacy localStorage) */
  ids: z.string().optional().openapi({
    example: "3,7,15",
    description: "Только category=custom без сессии: догрузка по ID из localStorage",
  }),
});

/** Query GET /api/templates/search */
export const TemplateSearchQuerySchema = z.object({
  q: z.string().openapi({ example: "faq", description: "Строка поиска" }),
});

/** Тело POST …/rate */
export const RateTemplateRequestSchema = z
  .object({
    rating: z.number().min(1).max(5).openapi({ example: 5 }),
  })
  .openapi("RateTemplateRequest");

/** Тело POST …/like */
export const LikeTemplateRequestSchema = z
  .object({
    liked: z.boolean().openapi({ example: true }),
  })
  .openapi("LikeTemplateRequest");

/** Тело POST …/bookmark */
export const BookmarkTemplateRequestSchema = z
  .object({
    bookmarked: z.boolean().openapi({ example: true }),
  })
  .openapi("BookmarkTemplateRequest");

/** Успех POST …/use для авторизованного */
export const UseTemplateAuthResponseSchema = z
  .object({
    message: z.string().openapi({
      example: "Template copied to your projects and collection",
    }),
    project: BotProjectSchema,
    copiedTemplate: BotTemplateDtoSchema,
  })
  .openapi("UseTemplateAuthResponse");

/** Успех POST …/use для гостя (legacy: только счётчик) */
export const UseTemplateGuestResponseSchema = z
  .object({
    message: z.string().openapi({ example: "Template use count incremented" }),
  })
  .openapi("UseTemplateGuestResponse");
