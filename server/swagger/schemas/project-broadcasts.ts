/**
 * @fileoverview OpenAPI-схемы project-broadcasts: params, list, create, preview.
 * @module server/swagger/schemas/project-broadcasts
 */

import "./common";
import { z } from "zod";

/** Path: projectId */
export const ProjectBroadcastsProjectIdParamsSchema = z.object({
  /** ID проекта */
  projectId: z.string().openapi({
    example: "42",
    description: "ID проекта",
    param: { description: "ID проекта", example: "42" },
  }),
});

/** Path: projectId + broadcastId */
export const ProjectBroadcastsIdParamsSchema = ProjectBroadcastsProjectIdParamsSchema.extend({
  /** ID рассылки */
  broadcastId: z.string().openapi({
    example: "15",
    description: "ID рассылки",
    param: { description: "ID рассылки", example: "15" },
  }),
});

/** Query списка / create (tokenId + пагинация) */
export const ProjectBroadcastsListQuerySchema = z.object({
  /** ID токена бота */
  tokenId: z.string().optional().openapi({
    example: "7",
    description: "Фильтр / выбор бота. Без него — default токен проекта.",
    param: { description: "ID токена бота", example: "7" },
  }),
  /** Страница (1..) */
  page: z.string().optional().openapi({
    example: "1",
    description: "Номер страницы (default 1)",
  }),
  /** Размер страницы (1..100, default 20) */
  limit: z.string().optional().openapi({
    example: "20",
    description: "Размер страницы (1..100, default 20)",
  }),
});

/** Фильтры аудитории */
export const BroadcastFiltersSchema = z
  .object({
    tags: z.array(z.string()).optional().openapi({ example: ["vip"] }),
    registeredFrom: z.string().optional().openapi({ example: "2026-01-01T00:00:00.000Z" }),
    registeredTo: z.string().optional().openapi({ example: "2026-08-01T00:00:00.000Z" }),
    activeFrom: z.string().optional().openapi({ example: "2026-07-01T00:00:00.000Z" }),
    activeTo: z.string().optional().openapi({ example: "2026-08-12T00:00:00.000Z" }),
    userIds: z.array(z.string()).optional().openapi({ example: ["123456789"] }),
    groupIds: z.array(z.string()).optional().openapi({ example: ["-1001234567890"] }),
  })
  .openapi("BroadcastFilters");

/** Запись рассылки (упрощённый DTO списка/детали) */
export const BroadcastItemSchema = z
  .object({
    id: z.number().int().openapi({ example: 15 }),
    projectId: z.number().int().openapi({ example: 42 }),
    campaignId: z.number().int().nullable().optional().openapi({
      example: null,
      description:
        "ID «большой рассылки», если запись — дочерняя рассылка одного бота. " +
        "`null` — обычная рассылка от одного бота.",
    }),
    tokenId: z.number().int().openapi({ example: 7 }),
    name: z.string().openapi({ example: "Акция августа" }),
    messageText: z.string().openapi({ example: "Привет! Скидка 20%." }),
    status: z
      .enum(["pending", "running", "stopped", "done", "failed"])
      .openapi({ example: "done" }),
    totalCount: z.number().int().openapi({ example: 120 }),
    sentCount: z.number().int().openapi({ example: 120 }),
    deliveredCount: z.number().int().openapi({ example: 115 }),
    failedCount: z.number().int().openapi({ example: 5 }),
    mediaUrls: z.array(z.string()).nullable().optional(),
    buttons: z.array(z.unknown()).nullable().optional(),
    buttonsPerRow: z.number().int().nullable().optional(),
    filters: BroadcastFiltersSchema.optional(),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    startedAt: z.union([z.string(), z.date()]).nullable().optional(),
    finishedAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BroadcastItem");

/** Ответ GET …/broadcasts */
export const BroadcastsListResponseSchema = z
  .object({
    broadcasts: z.array(BroadcastItemSchema),
    total: z.number().int().openapi({ example: 3 }),
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 20 }),
  })
  .openapi("BroadcastsListResponse");

/**
 * Список ботов «большой рассылки»: 1…100 ID токенов проекта.
 * Каждый ID проверяется на принадлежность проекту (иначе 400).
 */
export const BroadcastTokenIdsSchema = z
  .array(z.number().int().positive())
  .min(1)
  .max(100)
  .openapi({
    example: [7, 8],
    description:
      "ID токенов ботов проекта для «большой рассылки по нескольким ботам». " +
      "Приоритетнее `tokenId`. Все ID должны принадлежать этому проекту.",
  });

/** Тело POST …/broadcasts */
export const CreateBroadcastRequestSchema = z
  .object({
    name: z.string().max(200).optional().openapi({
      example: "Акция августа",
      description: "Необязательно. Пустое → «12 авг, 01:48 · начало текста…»",
    }),
    messageText: z.string().min(1).max(4096).openapi({ example: "Привет! Скидка 20%." }),
    mediaUrls: z.array(z.string()).max(10).optional().openapi({ example: [] }),
    buttons: z.array(z.unknown()).max(100).optional().openapi({ example: [] }),
    buttonsPerRow: z.number().int().min(0).max(8).optional().openapi({ example: 0 }),
    filters: BroadcastFiltersSchema.optional(),
    tokenId: z.number().int().positive().optional().openapi({ example: 7 }),
    tokenIds: BroadcastTokenIdsSchema.optional(),
  })
  .openapi("CreateBroadcastRequest");

/** Ответ POST …/broadcasts для одного бота */
export const CreateBroadcastResponseSchema = z
  .object({
    broadcastId: z.number().int().openapi({ example: 15 }),
  })
  .openapi("CreateBroadcastResponse");

/** Ответ POST …/broadcasts для «большой рассылки» (2+ бота) */
export const CreateBroadcastCampaignResponseSchema = z
  .object({
    campaignId: z.number().int().openapi({ example: 3, description: "ID созданной кампании" }),
    broadcastIds: z.array(z.number().int()).openapi({
      example: [15, 16],
      description: "ID дочерних рассылок в порядке переданных `tokenIds`",
    }),
  })
  .openapi("CreateBroadcastCampaignResponse");

/** Ответ POST …/broadcasts: один бот → broadcastId, несколько → campaignId */
export const CreateBroadcastResultSchema = z
  .union([CreateBroadcastResponseSchema, CreateBroadcastCampaignResponseSchema])
  .openapi("CreateBroadcastResult");

/** Тело POST …/preview-audience */
export const PreviewAudienceRequestSchema = z
  .object({
    filters: BroadcastFiltersSchema.optional(),
    tokenId: z.number().int().positive().optional().openapi({ example: 7 }),
    tokenIds: BroadcastTokenIdsSchema.optional(),
  })
  .openapi("PreviewAudienceRequest");

/** Аудитория одного бота «большой рассылки» */
export const AudiencePerBotSchema = z
  .object({
    tokenId: z.number().int().openapi({ example: 7 }),
    count: z.number().int().openapi({ example: 42 }),
  })
  .openapi("AudiencePerBot");

/** Ответ preview (sample — усечённый bot_users) */
export const PreviewAudienceResponseSchema = z
  .object({
    count: z.number().int().openapi({
      example: 42,
      description: "Сколько сообщений уйдёт всего (сумма по выбранным ботам)",
    }),
    sample: z.array(z.unknown()).openapi({
      description: "До 3 примеров пользователей аудитории",
    }),
    total: z.number().int().openapi({ example: 42, description: "То же, что `count`" }),
    uniqueCount: z.number().int().optional().openapi({
      example: 38,
      description: "Уникальных людей среди всех ботов (только для нескольких ботов)",
    }),
    perBot: z.array(AudiencePerBotSchema).openapi({
      description: "Разбивка аудитории по каждому выбранному боту",
    }),
    overlapEstimate: z.number().int().openapi({
      example: 4,
      description: "Сколько людей получат сообщение более чем от одного бота",
    }),
  })
  .openapi("PreviewAudienceResponse");
