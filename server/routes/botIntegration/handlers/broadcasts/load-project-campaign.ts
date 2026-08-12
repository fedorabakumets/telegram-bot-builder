/**
 * @fileoverview Загрузка кампании рассылки с проверкой принадлежности проекту.
 * Сам пишет HTTP-ошибку в ответ, чтобы не дублировать проверки в каждом хендлере
 * @module botIntegration/handlers/broadcasts/load-project-campaign
 */

import type { Request, Response } from "express";
import type { BroadcastCampaign } from "@shared/schema";
import { storage } from "../../../../storages/storage";

/** Результат загрузки кампании из параметров запроса */
export interface LoadedCampaign {
  /** ID проекта из маршрута */
  projectId: number;
  /** Найденная кампания проекта */
  campaign: BroadcastCampaign;
}

/**
 * Разбирает projectId/campaignId из маршрута, находит кампанию и проверяет,
 * что она принадлежит этому проекту. При ошибке отправляет ответ и возвращает null
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Проект и кампания либо null, если ответ уже отправлен
 */
export async function loadProjectCampaign(
  req: Request,
  res: Response,
): Promise<LoadedCampaign | null> {
  const projectId = Number.parseInt(req.params.projectId, 10);
  const campaignId = Number.parseInt(req.params.campaignId, 10);

  if (Number.isNaN(projectId) || Number.isNaN(campaignId)) {
    res.status(400).json({ message: "Неверный ID проекта или кампании" });
    return null;
  }

  const campaign = await storage.getBroadcastCampaignById(campaignId);
  if (!campaign) {
    res.status(404).json({ message: "Кампания рассылки не найдена" });
    return null;
  }

  if (campaign.projectId !== projectId) {
    res.status(403).json({ message: "Кампания не принадлежит этому проекту" });
    return null;
  }

  return { projectId, campaign };
}
