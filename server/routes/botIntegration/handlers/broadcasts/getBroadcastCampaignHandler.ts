/**
 * @fileoverview Хендлер получения кампании рассылки вместе с дочерними рассылками
 * @module botIntegration/handlers/broadcasts/getBroadcastCampaignHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { loadProjectCampaign } from "./load-project-campaign";

/**
 * Обрабатывает GET /api/projects/:projectId/broadcast-campaigns/:campaignId
 * Возвращает кампанию и её дочерние рассылки по каждому боту
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function getBroadcastCampaignHandler(req: Request, res: Response): Promise<void> {
  try {
    const loaded = await loadProjectCampaign(req, res);
    if (!loaded) return;

    const broadcasts = await storage.getBroadcastsByCampaignId(loaded.campaign.id);

    res.json({ campaign: loaded.campaign, broadcasts });
  } catch (error) {
    console.error("[getBroadcastCampaignHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
