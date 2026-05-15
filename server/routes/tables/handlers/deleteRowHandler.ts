/**
 * @fileoverview Хендлер удаления строки таблицы
 * @module routes/tables/handlers/deleteRowHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает DELETE /api/projects/:id/tables/:tableId/rows/:rowId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function deleteRowHandler(req: Request, res: Response): Promise<void> {
  try {
    const rowId = parseInt(req.params.rowId, 10);
    if (isNaN(rowId)) {
      res.status(400).json({ message: "Некорректный ID строки" });
      return;
    }

    const deleted = await storage.deleteBotTableRow(rowId);
    if (!deleted) {
      res.status(404).json({ message: "Строка не найдена" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[deleteRowHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось удалить строку" });
  }
}
