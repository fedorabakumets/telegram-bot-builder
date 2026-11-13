/**
 * @fileoverview Обработчик запросов истории запусков бота
 * @module server/routes/botManagement/handlers/botLaunchHistoryHandler
 */

import { parseLaunchPage } from './launch-page-query';
import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";
import { reconcileLaunchHistoryForToken } from "../../../bots/reconcileLaunchHistory";
import { resolveActualBotStatus } from '../resolve-actual-bot-status';

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
  const page = parseLaunchPage(req.query, 10, 100);
  if ('error' in page) {
    res.status(400).json({ error: page.error });
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
    /** Удалённый процесс нельзя считать остановленным по отсутствию локального PID. */
    const instance = await storage.getBotInstanceByToken(tokenId);
    const actual = await resolveActualBotStatus(projectId, tokenId, instance, true);
    /** Недоступность исполнителя и незавершённый запуск не закрывают историю. */
    if (actual === 'running' || actual === 'stopped' || actual === 'error') {
      await reconcileLaunchHistoryForToken(tokenId, actual === 'running');
    }

    const history = await storage.getLaunchHistory(tokenId, page.limit, page.beforeId);
    res.json(history);
  } catch (err) {
    console.error("[botLaunchHistoryHandler] Ошибка получения истории:", err);
    res.status(500).json({ error: "Ошибка получения истории запусков" });
  }
}
