/**
 * @fileoverview Хендлер получения списка рассылок проекта с пагинацией
 * @module botIntegration/handlers/broadcasts/getBroadcastsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getRequestTokenId } from "../../../utils/resolve-request-token";

/**
 * Обрабатывает GET /api/projects/:projectId/broadcasts
 * Возвращает список рассылок проекта с пагинацией
 * @param req - Объект запроса (query: page, limit, tokenId)
 * @param res - Объект ответа
 * @returns Результат обработки HTTP-запроса
 */
export async function getBroadcastsHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = Number.parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    const tokenId = getRequestTokenId(req);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const allBroadcasts = await storage.getBroadcasts(projectId, tokenId);
    const total = allBroadcasts.length;
    const offset = (page - 1) * limit;
    const broadcasts = allBroadcasts.slice(offset, offset + limit);

    res.json({ broadcasts, total, page, limit });
  } catch (error) {
    console.error("[getBroadcastsHandler] Ошибка:", error);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
}
