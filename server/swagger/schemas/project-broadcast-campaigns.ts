/**
 * @fileoverview OpenAPI-схемы кампаний рассылок («большая рассылка по нескольким ботам»):
 * params, карточка кампании, список и детали
 * @module server/swagger/schemas/project-broadcast-campaigns
 */

import "./common";
import { z } from "zod";
import {
  BroadcastFiltersSchema,
  BroadcastItemSchema,
  ProjectBroadcastsProjectIdParamsSchema,
} from "./project-broadcasts";

/** Path: projectId + campaignId */
export const ProjectCampaignIdParamsSchema = ProjectBroadcastsProjectIdParamsSchema.extend({
  /** ID кампании («большой рассылки») */
  campaignId: z.string().openapi({
    example: "3",
    description: "ID «большой рассылки» (кампании)",
    param: { description: "ID кампании рассылки", example: "3" },
  }),
});

/** Статус кампании, агрегированный из статусов дочерних рассылок */
export const BroadcastCampaignStatusSchema = z
  .enum(["pending", "running", "stopped", "done", "failed", "partial"])
  .openapi({
    example: "running",
    description:
      "Агрегат по ботам: есть running → `running`; все одинаковые → этот статус; " +
      "микс done/stopped → `stopped`; любой микс с failed → `partial`.",
  });

/** Карточка кампании («большой рассылки») */
export const BroadcastCampaignItemSchema = z
  .object({
    id: z.number().int().openapi({ example: 3 }),
    projectId: z.number().int().openapi({ example: 42 }),
    name: z.string().openapi({ example: "Акция августа" }),
    messageText: z.string().openapi({ example: "Привет! Скидка 20%." }),
    mediaUrls: z.array(z.string()).nullable().optional(),
    buttons: z.array(z.unknown()).nullable().optional(),
    buttonsPerRow: z.number().int().nullable().optional(),
    filters: BroadcastFiltersSchema.optional(),
    tokenIds: z.array(z.number().int()).openapi({
      example: [7, 8],
      description: "Боты проекта, по которым идёт «большая рассылка»",
    }),
    status: BroadcastCampaignStatusSchema,
    totalCount: z.number().int().openapi({ example: 240, description: "Получателей по всем ботам" }),
    sentCount: z.number().int().openapi({ example: 240 }),
    deliveredCount: z.number().int().openapi({ example: 231 }),
    failedCount: z.number().int().openapi({ example: 9 }),
    createdAt: z.union([z.string(), z.date()]).nullable().optional(),
    startedAt: z.union([z.string(), z.date()]).nullable().optional(),
    finishedAt: z.union([z.string(), z.date()]).nullable().optional(),
  })
  .openapi("BroadcastCampaignItem");

/** Ответ GET …/broadcast-campaigns */
export const BroadcastCampaignsListResponseSchema = z
  .object({
    campaigns: z.array(BroadcastCampaignItemSchema).openapi({
      description: "Кампании проекта, новые первыми",
    }),
  })
  .openapi("BroadcastCampaignsListResponse");

/** Ответ GET …/broadcast-campaigns/{campaignId} */
export const BroadcastCampaignDetailResponseSchema = z
  .object({
    campaign: BroadcastCampaignItemSchema,
    broadcasts: z.array(BroadcastItemSchema).openapi({
      description: "Дочерние рассылки — по одной на каждого бота кампании",
    }),
  })
  .openapi("BroadcastCampaignDetailResponse");
