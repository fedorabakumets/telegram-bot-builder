/**
 * @fileoverview OpenAPI-схемы изменения кампании рассылки: stop, edit, delete
 * @module server/swagger/schemas/project-broadcast-campaigns-mutate
 */

import "./common";
import { z } from "zod";
import { BroadcastCampaignItemSchema } from "./project-broadcast-campaigns";

/** Ответ POST …/broadcast-campaigns/{campaignId}/stop */
export const StopBroadcastCampaignResponseSchema = z
  .object({
    campaign: BroadcastCampaignItemSchema,
    stopped: z.array(z.number().int()).openapi({
      example: [15, 16],
      description: "ID дочерних рассылок, которым выставлен флаг остановки",
    }),
  })
  .openapi("StopBroadcastCampaignResponse");

/** Тело PUT …/broadcast-campaigns/{campaignId} */
export const EditBroadcastCampaignRequestSchema = z
  .object({
    messageText: z.string().min(1).max(4096).openapi({
      example: "Обновлённый текст рассылки",
      description: "Новый HTML-текст для всех ботов кампании (лимит Telegram 4096)",
    }),
  })
  .openapi("EditBroadcastCampaignRequest");

/** Правка текста в разрезе одного бота кампании */
export const CampaignEditPerBotSchema = z
  .object({
    broadcastId: z.number().int().openapi({ example: 15 }),
    tokenId: z.number().int().openapi({ example: 7 }),
    edited: z.number().int().openapi({ example: 110 }),
    failed: z.number().int().openapi({ example: 5 }),
  })
  .openapi("CampaignEditPerBot");

/** Ответ PUT …/broadcast-campaigns/{campaignId} */
export const EditBroadcastCampaignResponseSchema = z
  .object({
    ok: z.literal(true).openapi({ example: true }),
    edited: z.number().int().openapi({ example: 221, description: "Отредактировано по всем ботам" }),
    failed: z.number().int().openapi({ example: 9 }),
    perBot: z.array(CampaignEditPerBotSchema).openapi({
      description: "Результат правки по каждому боту кампании",
    }),
  })
  .openapi("EditBroadcastCampaignResponse");

/** Ответ DELETE …/broadcast-campaigns/{campaignId} */
export const DeleteBroadcastCampaignResponseSchema = z
  .object({
    ok: z.literal(true).openapi({ example: true }),
    deleted: z.number().int().openapi({
      example: 231,
      description: "Сколько сообщений пытались удалить в Telegram по всем ботам",
    }),
    broadcasts: z.number().int().openapi({
      example: 2,
      description: "Сколько дочерних рассылок удалено вместе с кампанией",
    }),
  })
  .openapi("DeleteBroadcastCampaignResponse");
