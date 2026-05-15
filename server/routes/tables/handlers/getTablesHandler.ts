/**
 * @fileoverview Хендлер получения списка таблиц проекта
 * @module routes/tables/handlers/getTablesHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает GET /api/projects/:id/tables
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function getTablesHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: "Некорректный ID проекта" });
      return;
    }

    const tables = await storage.getBotTables(projectId);
    res.json(tables);
  } catch (error) {
    console.error("[getTablesHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось получить таблицы" });
  }
}
