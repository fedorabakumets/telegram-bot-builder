/**
 * @fileoverview Хендлер остановки рассылки
 * @module botIntegration/handlers/broadcasts/stopBroadcastHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { activeBroadcasts } from "./broadcastQueue";

/**
 * Обрабатывает POST /api/projects/:projectId/broadcasts/:broadcastId/stop
 * Устанавливает флаг остановки рассылки
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Результат обработки HTTP-запроса
 */
export async function stopBroadcastHandler(req: Request, res: Response): Promise<void> {
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

    if (broadcast.status !== "running") {
      res.status(400).json({ message: "Рассылка не запущена" });
      return;
    }

    // Устанавливаем флаг остановки для очереди
    activeBroadcasts.set(broadcastId, "stopped");

    const updated = await storage.stopBroadcast(broadcastId);
    res.json({ broadcast: updated });
  } catch (error) {
    console.error("[stopBroadcastHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
