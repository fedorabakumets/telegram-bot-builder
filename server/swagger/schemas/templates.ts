/**
 * @fileoverview OpenAPI-схемы библиотеки сценариев (`/api/templates`, таблица `bot_templates`).
 * Не путать с `lib/templates/` (Jinja2-генерация Python-кода бота).
 * @module server/swagger/schemas/templates
 */

import "./common";
import { z } from "zod";

/** Запись сценария из `bot_templates` (ответ API) */
export const BotTemplateDtoSchema = z
  .object({
    /** ID записи `bot_templates` */
    id: z.number().int().openapi({ example: 12 }),
    /** Владелец (Telegram user id); `null` = системный/официальный */
    ownerId: z.number().nullable().openapi({ example: null }),
    /** Название сценария */
    name: z.string().openapi({ example: "FAQ-бот" }),
    /** Описание */
    description: z.string().nullable().openapi({ example: "Ответы на частые вопросы" }),
    /** JSON проекта (nodes/edges/sheets) */
    data: z.unknown().openapi({
      example: { sheets: [{ id: "main", nodes: [], edges: [] }] },
    }),
    /**
     * Алиас `data` — только в `GET /api/templates` (маппинг для фронта).
     * В featured/category/by-id обычно отсутствует.
     */
    flow_data: z.unknown().optional(),
    /** Категория: custom | business | entertainment | education | utility | games | official | community */
    category: z.string().nullable().openapi({ example: "utility" }),
    /** Теги */
    tags: z.array(z.string()).nullable().optional(),
    /** 0 = приватный, 1 = публичный */
    isPublic: z.number().int().openapi({ example: 1 }),
    /** easy | medium | hard */
    difficulty: z.string().nullable().openapi({ example: "easy" }),
    /** Устаревший author id (строка) */
    authorId: z.string().nullable().optional(),
    /** Имя автора в карточке */
    authorName: z.string().nullable().optional(),
    /** Счётчик использований (`POST …/use`) */
    useCount: z.number().int().openapi({ example: 42 }),
    /** Агрегированный рейтинг */
    rating: z.number().int().openapi({ example: 0 }),
    /** Число оценок */
    ratingCount: z.number().int().openapi({ example: 0 }),
    /** 1 = в «Рекомендуемых» */
    featured: z.number().int().openapi({ example: 1 }),
    /** Версия сценария */
    version: z.string().nullable().optional(),
    /** URL превью */
    previewImage: z.string().nullable().optional(),
    /** Последнее использование */
    lastUsedAt: z.union([z.string(), z.date()]).nullable().optional(),
    downloadCount: z.number().int().optional(),
    likeCount: z.number().int().optional(),
    bookmarkCount: z.number().int().optional(),
    viewCount: z.number().int().optional(),
    /** Язык UI сценария */
    language: z.string().nullable().openapi({ example: "ru" }),
    requiresToken: z.number().int().optional(),
    /** Сложность 1–10 */
    complexity: z.number().int().openapi({ example: 1 }),
    /** Оценка времени настройки, мин */
    estimatedTime: z.number().int().openapi({ example: 5 }),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BotTemplateDto");

/** Список сценариев */
export const BotTemplateListSchema = z
  .array(BotTemplateDtoSchema)
  .openapi("BotTemplateList");

/** Простое сообщение templates (`message`) */
export const TemplateMessageSchema = z
  .object({
    message: z.string().openapi({ example: "Template deleted successfully" }),
  })
  .openapi("TemplateMessage");

/** Ошибка валидации create/update (Zod) */
export const TemplateValidationErrorSchema = z
  .object({
    message: z.string().openapi({ example: "Invalid data" }),
    errors: z.array(z.unknown()).optional(),
  })
  .openapi("TemplateValidationError");

/** Ответ admin seed refresh/recreate */
export const TemplateSeedOkSchema = z
  .object({
    message: z.string().openapi({ example: "Templates refreshed successfully" }),
    timestamp: z.string().openapi({ example: "2026-08-08T19:00:00.000Z" }),
  })
  .openapi("TemplateSeedOk");
