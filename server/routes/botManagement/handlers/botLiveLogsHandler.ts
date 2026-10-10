/**
 * @fileoverview GET live-логи бота из таблицы bot_logs
 * @module botManagement/handlers/botLiveLogsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { parseBotLogPeriodQuery } from './bot-log-period-query';

/**
 * GET /api/projects/:projectId/tokens/:tokenId/logs
 * @param req - Express запрос
 * @param res - Express ответ
 */
export async function handleGetLiveBotLogs(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.projectId);
    const tokenId = parseInt(req.params.tokenId);
    let query;
    try { query = parseBotLogPeriodQuery(req.query); }
    catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Некорректный период' });
      return;
    }

    if (isNaN(projectId) || isNaN(tokenId)) {
      res.status(400).json({ error: "Некорректные projectId или tokenId" });
      return;
    }

    /** Без диапазона сохраняем живые логи последнего запуска. */
    const logs = query.from && query.to
      ? await storage.getBotLogsInPeriod(projectId, tokenId, query.from, query.to, query.limit, query.beforeId)
      : await storage.getLatestLaunchLogs(projectId, tokenId, query.limit);
    res.json(logs);
  } catch (err) {
    console.error("[LiveBotLogs] Ошибка получения логов:", err);
    res.status(500).json({ error: "Ошибка получения логов" });
  }
}
