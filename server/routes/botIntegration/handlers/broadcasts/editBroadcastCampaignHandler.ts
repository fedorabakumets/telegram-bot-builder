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
import { acquireBroadcastEdit, BroadcastEditConflict, broadcastEditResponse, emptyBroadcastEditStats } from "./broadcast-edit-state";
import type { BroadcastEditStats } from "./broadcast-edit-state";

/**
 * Обрабатывает PUT /api/projects/:projectId/broadcast-campaigns/:campaignId
 * Редактирует текст отправленных сообщений во всех ботах кампании
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function editBroadcastCampaignHandler(req: Request, res: Response): Promise<void> {
  let release: (() => void) | undefined;
  try {
    const loaded = await loadProjectCampaign(req, res);
    if (!loaded) return;

    const validation = editBroadcastCampaignBodySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: "Неверное тело запроса", errors: validation.error.issues });
      return;
    }

    const { messageText } = validation.data;
    const { projectId, campaign } = loaded;
    release = acquireBroadcastEdit(-campaign.id);
    const children = await storage.getBroadcastsByCampaignId(campaign.id);

    if (children.some(child => ["running", "pending"].includes(child.status))) {
      throw new BroadcastEditConflict("Сначала остановите отправку кампании");
    }
    const total = emptyBroadcastEditStats();
    const perBot: Array<BroadcastEditStats & { broadcastId: number; tokenId: number; error?: string }> = [];

    for (const child of children) {
      let stats = emptyBroadcastEditStats();
      let error: string | undefined;
      try {
        stats = await editBroadcastMessages(projectId, child.id, child.tokenId, messageText);
      } catch (cause) {
        stats.unknown++;
        error = cause instanceof BroadcastEditConflict ? cause.message : "Не удалось завершить правку рассылки";
      }
      for (const key of Object.keys(total) as Array<keyof BroadcastEditStats>) total[key] += stats[key];
      perBot.push({ broadcastId: child.id, tokenId: child.tokenId, ...stats, ...(error ? { error } : {}) });
    }

    if (broadcastEditResponse(total).ok) {
      try { await storage.updateBroadcastCampaign(campaign.id, { messageText }); }
      catch { total.persistenceFailed++; }
    }

    res.json({ ...broadcastEditResponse(total), perBot });
  } catch (error) {
    if (error instanceof BroadcastEditConflict) {
      res.status(409).json({ message: error.message });
      return;
    }
    console.error("[editBroadcastCampaignHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  } finally { release?.(); }
}
