/**
 * @fileoverview Хендлер списка Telegram-групп проекта
 * @module botIntegration/handlers/groups/getGroupsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Возвращает группы проекта из `bot_groups`.
 * @param req - Запрос (`params.id` или `params.projectId`)
 * @param res - Ответ
 * @returns Promise<void>
 */
export async function getGroupsHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id ?? req.params.projectId, 10);

    if (isNaN(projectId)) {
      res.status(400).json({ message: "Неверный ID проекта" });
      return;
    }

    const groups = await storage.getBotGroupsByProject(projectId);
    res.json(groups);
  } catch (error) {
    console.error("Ошибка получения групп:", error);
    res.status(500).json({ message: "Не удалось получить группы" });
  }
}
