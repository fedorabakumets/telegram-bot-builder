/**
 * @fileoverview GET одной записи лога по ID (для постоянных ссылок)
 * @module botManagement/handlers/botLogByIdHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";

/**
 * GET /api/bot-logs/:logId
 * @param req - Express запрос
 * @param res - Express ответ
 */
export async function handleGetBotLogById(req: Request, res: Response): Promise<void> {
  try {
    const logId = parseInt(req.params.logId, 10);
    if (isNaN(logId)) {
      res.status(400).json({ error: "Некорректный logId" });
      return;
    }

    const log = await storage.getBotLogById(logId);
    if (!log) {
      res.status(404).json({ error: "Запись лога не найдена" });
      return;
    }

    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId !== null) {
      const hasAccess = await storage.hasProjectAccess(log.projectId, ownerId);
      if (!hasAccess) {
        res.status(403).json({ error: "Нет прав доступа к проекту" });
        return;
      }
    }

    res.json(log);
  } catch (err) {
    console.error("[BotLogById] Ошибка получения лога:", err);
    res.status(500).json({ error: "Ошибка получения лога" });
  }
}
