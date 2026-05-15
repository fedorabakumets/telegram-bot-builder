/**
 * @fileoverview Хендлер получения колонок таблицы
 * @module routes/tables/handlers/getColumnsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает GET /api/projects/:id/tables/:tableId/columns
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function getColumnsHandler(req: Request, res: Response): Promise<void> {
  try {
    const tableId = parseInt(req.params.tableId, 10);
    if (isNaN(tableId)) {
      res.status(400).json({ message: "Некорректный ID таблицы" });
      return;
    }

    const columns = await storage.getBotTableColumns(tableId);
    res.json(columns);
  } catch (error) {
    console.error("[getColumnsHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось получить колонки" });
  }
}
