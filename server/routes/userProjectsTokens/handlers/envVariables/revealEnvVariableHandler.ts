/**
 * @fileoverview Хендлер раскрытия секретного значения переменной окружения
 * @module userProjectsTokens/handlers/envVariables/revealEnvVariableHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getBotActorId } from "../../../../middleware/bot-api-actor";

/**
 * Возвращает реальное значение секретной переменной (для кнопки «показать»).
 *
 * @param req - Запрос с params.id и query.telegram_id
 * @param res - Ответ: { value: string } или ошибка
 */
export async function revealEnvVariableHandler(req: Request, res: Response): Promise<void> {
  try {
    const telegramId = getBotActorId(req);
    const variableId = parseInt(req.params.id, 10);

    if (telegramId === null) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
      }

    if (isNaN(variableId)) {
      res.status(400).json({ error: "Некорректный id переменной" });
      return;
    }

    const variable = await storage.getEnvVariable(variableId);
    if (!variable) {
      res.status(404).json({ error: "Переменная не найдена" });
      return;
    }

    const token = await storage.getBotToken(variable.tokenId);
    if (!token) {
      res.status(404).json({ error: "Токен не найден" });
      return;
    }

    if (!(await storage.hasProjectAccess(token.projectId, telegramId))) {
      res.status(403).json({ error: "Нет доступа" });
      return;
    }

    res.json({ value: variable.value });
  } catch (error: any) {
    console.error("Ошибка раскрытия env переменной:", error);
    res.status(500).json({ error: "Не удалось получить значение" });
  }
}
