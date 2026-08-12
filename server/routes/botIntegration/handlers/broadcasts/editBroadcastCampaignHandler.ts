/**
 * @fileoverview Хендлер редактирования кампании рассылки —
 * правит текст у всех дочерних рассылок и в самой кампании
 * @module botIntegration/handlers/broadcasts/editBroadcastCampaignHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { editBroadcastCampaignBodySchema } from "./broadcast-body-schemas";
import { editBroadcastMessages } from "./edit-broadcast-messages";
import { loadProjectCampaign } from "./load-project-campaign";

/**
 * Обрабатывает PUT /api/projects/:projectId/broadcast-campaigns/:campaignId
 * Редактирует текст отправленных сообщений во всех ботах кампании
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function editBroadcastCampaignHandler(req: Request, res: Response): Promise<void> {
  try {
    const loaded = await loadProjectCampaign(req, res);
    if (!loaded) return;

    const validation = editBroadcastCampaignBodySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Неверное тело запроса", errors: validation.error.errors });
      return;
    }

    const { messageText } = validation.data;
    const { projectId, campaign } = loaded;
    const children = await storage.getBroadcastsByCampaignId(campaign.id);

    let edited = 0;
    let failed = 0;
    const perBot: Array<{ broadcastId: number; tokenId: number; edited: number; failed: number }> = [];

    for (const child of children) {
      const stats = await editBroadcastMessages(projectId, child.id, child.tokenId, messageText);
      edited += stats.edited;
      failed += stats.failed;
      perBot.push({ broadcastId: child.id, tokenId: child.tokenId, ...stats });
    }

    await storage.updateBroadcastCampaign(campaign.id, { messageText });

    res.json({ ok: true, edited, failed, perBot });
  } catch (error) {
    console.error("[editBroadcastCampaignHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
