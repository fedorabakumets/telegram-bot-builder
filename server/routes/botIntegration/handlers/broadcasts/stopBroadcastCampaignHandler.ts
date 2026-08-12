/**
 * @fileoverview Хендлер остановки кампании рассылки — останавливает все запущенные дочерние очереди
 * @module botIntegration/handlers/broadcasts/stopBroadcastCampaignHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { activeBroadcasts } from "./broadcastQueue";
import { loadProjectCampaign } from "./load-project-campaign";
import { syncCampaignAggregates } from "./sync-campaign-aggregates";

/**
 * Обрабатывает POST /api/projects/:projectId/broadcast-campaigns/:campaignId/stop
 * Выставляет флаг остановки всем работающим дочерним рассылкам и пересчитывает агрегаты
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function stopBroadcastCampaignHandler(req: Request, res: Response): Promise<void> {
  try {
    const loaded = await loadProjectCampaign(req, res);
    if (!loaded) return;

    const children = await storage.getBroadcastsByCampaignId(loaded.campaign.id);
    const running = children.filter((child) => child.status === "running");

    for (const child of running) {
      // Флаг читает очередь между батчами, затем фиксируем статус в БД
      activeBroadcasts.set(child.id, "stopped");
      await storage.stopBroadcast(child.id);
    }

    const campaign = await syncCampaignAggregates(loaded.campaign.id);

    res.json({
      campaign: campaign ?? loaded.campaign,
      stopped: running.map((child) => child.id),
    });
  } catch (error) {
    console.error("[stopBroadcastCampaignHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
