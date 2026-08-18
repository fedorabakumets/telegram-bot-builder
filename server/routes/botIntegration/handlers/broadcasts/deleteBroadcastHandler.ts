/**
 * @fileoverview Хендлер удаления рассылки — удаляет сообщения из Telegram и из БД
 * @module botIntegration/handlers/broadcasts/deleteBroadcastHandler
 */

import type { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../../../../database/db";
import { broadcasts } from "@shared/schema";
import { activeBroadcasts } from "./broadcastQueue";
import { deleteBroadcastMessages } from "./delete-broadcast-messages";
import { pruneCampaignAfterChildDelete } from "./prune-campaign-after-child-delete";

/**
 * Обрабатывает DELETE /api/projects/:projectId/broadcasts/:broadcastId
 * Удаляет сообщения из Telegram у получателей, затем рассылку и связанные записи из БД
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function deleteBroadcastHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    const broadcastId = Number.parseInt(req.params.broadcastId, 10);

    if (Number.isNaN(projectId) || Number.isNaN(broadcastId)) {
      res.status(400).json({ message: "Неверные параметры запроса" });
      return;
    }

    const [broadcast] = await db
      .select()
      .from(broadcasts)
      .where(and(eq(broadcasts.id, broadcastId), eq(broadcasts.projectId, projectId)));

    if (!broadcast) {
      res.status(404).json({ message: "Рассылка не найдена" });
      return;
    }

    if (broadcast.status === "running") activeBroadcasts.set(broadcast.id, "stopped");

    const deleted = await deleteBroadcastMessages(projectId, broadcastId, broadcast.tokenId);
    await db.delete(broadcasts).where(eq(broadcasts.id, broadcastId));
    await pruneCampaignAfterChildDelete(broadcast.campaignId);

    res.json({ ok: true, deleted });
  } catch (error) {
    console.error("[deleteBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
