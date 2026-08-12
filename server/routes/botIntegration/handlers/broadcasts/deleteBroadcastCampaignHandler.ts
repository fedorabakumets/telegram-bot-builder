/**
 * @fileoverview Хендлер удаления кампании рассылки —
 * удаляет сообщения всех дочерних рассылок из Telegram, затем саму кампанию (каскад)
 * @module botIntegration/handlers/broadcasts/deleteBroadcastCampaignHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { activeBroadcasts } from "./broadcastQueue";
import { deleteBroadcastMessages } from "./delete-broadcast-messages";
import { loadProjectCampaign } from "./load-project-campaign";

/**
 * Обрабатывает DELETE /api/projects/:projectId/broadcast-campaigns/:campaignId
 * Останавливает активные очереди, удаляет сообщения у получателей и саму кампанию
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function deleteBroadcastCampaignHandler(req: Request, res: Response): Promise<void> {
  try {
    const loaded = await loadProjectCampaign(req, res);
    if (!loaded) return;

    const { projectId, campaign } = loaded;
    const children = await storage.getBroadcastsByCampaignId(campaign.id);

    let deleted = 0;
    for (const child of children) {
      // Останавливаем очередь, иначе она продолжит слать сообщения уже удалённой кампании
      if (child.status === "running") activeBroadcasts.set(child.id, "stopped");
      deleted += await deleteBroadcastMessages(projectId, child.id, child.tokenId);
    }

    // Дочерние рассылки и их результаты уходят каскадом по campaign_id
    await storage.deleteBroadcastCampaign(campaign.id);

    res.json({ ok: true, deleted, broadcasts: children.length });
  } catch (error) {
    console.error("[deleteBroadcastCampaignHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
