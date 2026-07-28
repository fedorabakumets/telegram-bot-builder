/**
 * @fileoverview Обработчик запросов истории запусков бота
 * @module server/routes/botManagement/handlers/botLaunchHistoryHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";
import { workerManager } from "../../../bots/botWorkerManager";
import { reconcileLaunchHistoryForToken } from "../../../bots/reconcileLaunchHistory";
import { findActiveProcessForToken } from "../../../utils/findActiveProcessForToken";

/**
 * Обрабатывает GET /api/tokens/:tokenId/launch-history
 * Перед ответом сверняет orphans с live-статусом (self-heal).
 * @param req - HTTP запрос с параметром tokenId
 * @param res - HTTP ответ
 */
export async function handleGetLaunchHistory(req: Request, res: Response): Promise<void> {
  const tokenId = parseInt(req.params.tokenId, 10);
  if (isNaN(tokenId)) {
    res.status(400).json({ error: "Некорректный tokenId" });
    return;
  }
  try {
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

    const projectId = tokenRecord.projectId;
    const activeProcess = findActiveProcessForToken(projectId, tokenId);
    const isRunningInWorker = process.env.USE_WORKER_POOL !== 'false'
      && workerManager.isBotRunning(projectId, tokenId);
    const isLiveRunning = !!(activeProcess || isRunningInWorker);

    await reconcileLaunchHistoryForToken(tokenId, isLiveRunning);

    const history = await storage.getLaunchHistory(tokenId, 10);
    res.json(history);
  } catch (err) {
    console.error("[botLaunchHistoryHandler] Ошибка получения истории:", err);
    res.status(500).json({ error: "Ошибка получения истории запусков" });
  }
}
