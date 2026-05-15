/**
 * @fileoverview Хендлер переименования колонки таблицы
 * @module routes/tables/handlers/renameColumnHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает PUT /api/projects/:id/tables/:tableId/columns/:columnId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function renameColumnHandler(req: Request, res: Response): Promise<void> {
  try {
    const columnId = parseInt(req.params.columnId, 10);
    if (isNaN(columnId)) {
      res.status(400).json({ message: "Некорректный ID колонки" });
      return;
    }

    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ message: "Новое название обязательно" });
      return;
    }

    const column = await storage.renameBotTableColumn(columnId, name);
    if (!column) {
      res.status(404).json({ message: "Колонка не найдена" });
      return;
    }

    res.json(column);
  } catch (error) {
    console.error("[renameColumnHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось переименовать колонку" });
  }
}
