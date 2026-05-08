/**
 * @fileoverview Хендлер получения деталей рассылки с результатами ошибок
 * @module botIntegration/handlers/broadcasts/getBroadcastDetailHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает GET /api/projects/:projectId/broadcasts/:broadcastId
 * Возвращает детали рассылки и результаты с ошибками
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Результат обработки HTTP-запроса
 */
export async function getBroadcastDetailHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    const broadcastId = Number.parseInt(req.params.broadcastId, 10);

    if (Number.isNaN(projectId) || Number.isNaN(broadcastId)) {
      res.status(400).json({ message: "Неверный ID проекта или рассылки" });
      return;
    }

    const broadcast = await storage.getBroadcastById(broadcastId);
    if (!broadcast) {
      res.status(404).json({ message: "Рассылка не найдена" });
      return;
    }

    if (broadcast.projectId !== projectId) {
      res.status(403).json({ message: "Рассылка не принадлежит этому проекту" });
      return;
    }

    const allResults = await storage.getBroadcastResults(broadcastId);
    // Возвращаем только ошибки для детальной страницы
    const errors = allResults.filter(r => r.status !== "sent");

    res.json({ broadcast, results: errors });
  } catch (error) {
    console.error("[getBroadcastDetailHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
