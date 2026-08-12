/**
 * @fileoverview Хендлер списка кампаний рассылок проекта
 * @module botIntegration/handlers/broadcasts/listBroadcastCampaignsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает GET /api/projects/:projectId/broadcast-campaigns
 * Возвращает список кампаний проекта, новые первыми
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns void
 */
export async function listBroadcastCampaignsHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    const campaigns = await storage.getBroadcastCampaigns(projectId);

    res.json({ campaigns });
  } catch (error) {
    console.error("[listBroadcastCampaignsHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
