/**
 * @fileoverview GET live-логи бота из таблицы bot_logs
 * @module botManagement/handlers/botLiveLogsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * GET /api/projects/:projectId/tokens/:tokenId/logs
 * @param req - Express запрос
 * @param res - Express ответ
 */
export async function handleGetLiveBotLogs(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId);
    const tokenId = parseInt(req.params.tokenId);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 500;

    if (isNaN(projectId) || isNaN(tokenId)) {
      res.status(400).json({ error: "Некорректные projectId или tokenId" });
      return;
    }

    const logs = await storage.getLatestLaunchLogs(projectId, tokenId, limit);
    res.json(logs);
  } catch (err) {
    console.error("[LiveBotLogs] Ошибка получения логов:", err);
    res.status(500).json({ error: "Ошибка получения логов" });
  }
}
