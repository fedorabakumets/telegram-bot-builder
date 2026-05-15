/**
 * @fileoverview Хендлер переиндексации строк таблицы
 * @module routes/tables/handlers/reindexRowsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает POST /api/projects/:id/tables/:tableId/rows/reindex
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function reindexRowsHandler(req: Request, res: Response): Promise<void> {
  try {
    const tableId = parseInt(req.params.tableId, 10);
    if (isNaN(tableId)) {
      res.status(400).json({ message: "Некорректный ID таблицы" });
      return;
    }

    await storage.reindexBotTableRows(tableId);
    res.json({ success: true });
  } catch (error) {
    console.error("[reindexRowsHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось переиндексировать строки" });
  }
}
