/**
 * @fileoverview Хендлер получения переменных окружения токена
 * @module userProjectsTokens/handlers/envVariables/getEnvVariablesHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Возвращает список переменных окружения для указанного токена.
 * Секретные значения маскируются звёздочками.
 *
 * @param req - Запрос с params.tokenId и query.telegram_id
 * @param res - Ответ: { items: [...], count: N }
 */
export async function getEnvVariablesHandler(req: Request, res: Response): Promise<void> {
  try {
    const telegramId = Number(req.query.telegram_id);
    const tokenId = parseInt(req.params.tokenId, 10);

    if (!telegramId || isNaN(telegramId)) {
      res.status(400).json({ error: "Параметр telegram_id обязателен" });
      return;
    }

    if (isNaN(tokenId)) {
      res.status(400).json({ error: "Некорректный tokenId" });
      return;
    }

    const token = await storage.getBotToken(tokenId);
    if (!token) {
      res.status(404).json({ error: "Токен не найден" });
      return;
    }

    if (!(await storage.hasProjectAccess(token.projectId, telegramId))) {
      res.status(403).json({ error: "Нет доступа" });
      return;
    }

    const items = await storage.getEnvVariables(tokenId);

    /** Маскируем секретные значения */
    const masked = items.map(item => ({
      ...item,
      value: item.isSecret ? "••••••••" : item.value,
    }));

    res.json({ items: masked, count: masked.length });
  } catch (error: any) {
    console.error("Ошибка получения env переменных:", error);
    res.status(500).json({ error: "Не удалось получить переменные" });
  }
}
