/**
 * @fileoverview Клиентские zod-схемы create/update шаблонов без привилегированных полей.
 * featured, счётчики и ownerId с клиента не принимаются.
 * @module server/routes/templates/template-body-schemas
 */

import { z } from "zod";

/** Категории сценария */
const categoryEnum = z.enum([
  "custom",
  "business",
  "entertainment",
  "education",
  "utility",
  "games",
  "official",
  "community",
]);

/** Тело POST /api/templates (без featured/счётчиков/ownerId) */
export const createBotTemplateBodySchema = z
  .object({
    name: z.string().min(1, "Название сценария обязательно"),
    description: z.string().nullable().optional(),
    data: z.unknown(),
    category: categoryEnum.default("custom"),
    tags: z.array(z.string()).optional(),
    isPublic: z.number().min(0).max(1).default(0),
    difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
    authorId: z.string().nullable().optional(),
    authorName: z.string().nullable().optional(),
    version: z.string().default("1.0.0").optional(),
    previewImage: z.string().nullable().optional(),
    language: z
      .enum(["ru", "en", "es", "fr", "de", "it", "pt", "zh", "ja", "ko"])
      .default("ru"),
    requiresToken: z.number().min(0).max(1).default(0),
    complexity: z.number().min(1).max(10).default(1),
    estimatedTime: z.number().min(1).max(120).default(5),
  });

/** Тело PUT /api/templates/{id} — частичное, без привилегированных полей */
export const updateBotTemplateBodySchema = createBotTemplateBodySchema.partial();

/** Тип тела создания */
export type CreateBotTemplateBody = z.infer<typeof createBotTemplateBodySchema>;

/** Тип тела обновления */
export type UpdateBotTemplateBody = z.infer<typeof updateBotTemplateBodySchema>;
