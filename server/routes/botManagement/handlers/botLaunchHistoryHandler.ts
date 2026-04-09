/**
 * @fileoverview Обработчик запросов истории запусков бота
 * @module server/routes/botManagement/handlers/botLaunchHistoryHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает GET /api/tokens/:tokenId/launch-history
 * Возвращает последние 10 запусков для указанного токена
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
    const history = await storage.getLaunchHistory(tokenId, 10);
    res.json(history);
  } catch (err) {
    console.error("[botLaunchHistoryHandler] Ошибка получения истории:", err);
    res.status(500).json({ error: "Ошибка получения истории запусков" });
  }
}
