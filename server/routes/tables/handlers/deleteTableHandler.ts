/**
 * @fileoverview Хендлер удаления таблицы проекта
 * @module routes/tables/handlers/deleteTableHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает DELETE /api/projects/:id/tables/:tableId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function deleteTableHandler(req: Request, res: Response): Promise<void> {
  try {
    const tableId = parseInt(req.params.tableId, 10);
    if (isNaN(tableId)) {
      res.status(400).json({ message: "Некорректный ID таблицы" });
      return;
    }

    const deleted = await storage.deleteBotTable(tableId);
    if (!deleted) {
      res.status(404).json({ message: "Таблица не найдена" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[deleteTableHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось удалить таблицу" });
  }
}
