/**
 * @fileoverview Хендлер удаления колонки таблицы
 * @module routes/tables/handlers/deleteColumnHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает DELETE /api/projects/:id/tables/:tableId/columns/:columnId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function deleteColumnHandler(req: Request, res: Response): Promise<void> {
  try {
    const columnId = parseInt(req.params.columnId, 10);
    if (isNaN(columnId)) {
      res.status(400).json({ message: "Некорректный ID колонки" });
      return;
    }

    const deleted = await storage.deleteBotTableColumn(columnId);
    if (!deleted) {
      res.status(404).json({ message: "Колонка не найдена" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[deleteColumnHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось удалить колонку" });
  }
}
