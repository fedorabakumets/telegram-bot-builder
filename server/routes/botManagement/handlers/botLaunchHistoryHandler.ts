/**
 * @fileoverview Обработчик запросов истории запусков бота
 * @module server/routes/botManagement/handlers/botLaunchHistoryHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";

/**
 * Обрабатывает GET /api/tokens/:tokenId/launch-history
 * Резолвит projectId токена, проверяет владение и возвращает последние 10 запусков
 * @param req - HTTP запрос с параметром tokenId
 * @param res - HTTP ответ
 * @returns JSON массив записей истории запусков
 */
export async function handleGetLaunchHistory(req: Request, res: Response): Promise<void> {
  const tokenId = parseInt(req.params.tokenId);
  if (isNaN(tokenId)) {
    res.status(400).json({ error: "Некорректный tokenId" });
    return;
  }
  try {
    // Проверка владения: резолвим токен → projectId → доступ владельца/коллаборатора
    const tokenRecord = await storage.getBotToken(tokenId);
    if (!tokenRecord) {
      res.status(404).json({ error: "Токен не найден" });
      return;
    }
    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId === null) {
      res.status(403).json({ error: "Нет прав доступа" });
      return;
    }
    const hasAccess = await storage.hasProjectAccess(tokenRecord.projectId, ownerId);
    if (!hasAccess) {
      res.status(403).json({ error: "Нет прав доступа" });
      return;
    }

    const history = await storage.getLaunchHistory(tokenId, 10);
    res.json(history);
  } catch (err) {
    console.error("[botLaunchHistoryHandler] Ошибка получения истории:", err);
    res.status(500).json({ error: "Ошибка получения истории запусков" });
  }
}
