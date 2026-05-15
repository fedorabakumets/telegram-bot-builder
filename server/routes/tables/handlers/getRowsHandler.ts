/**
 * @fileoverview Хендлер получения строк таблицы
 * @module routes/tables/handlers/getRowsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает GET /api/projects/:id/tables/:tableId/rows
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function getRowsHandler(req: Request, res: Response): Promise<void> {
  try {
    const tableId = parseInt(req.params.tableId, 10);
    if (isNaN(tableId)) {
      res.status(400).json({ message: "Некорректный ID таблицы" });
      return;
    }

    const rows = await storage.getBotTableRows(tableId);
    res.json(rows);
  } catch (error) {
    console.error("[getRowsHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось получить строки" });
  }
}
