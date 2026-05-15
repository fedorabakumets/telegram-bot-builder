/**
 * @fileoverview Хендлер переименования таблицы проекта
 * @module routes/tables/handlers/renameTableHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает PUT /api/projects/:id/tables/:tableId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function renameTableHandler(req: Request, res: Response): Promise<void> {
  try {
    const tableId = parseInt(req.params.tableId, 10);
    if (isNaN(tableId)) {
      res.status(400).json({ message: "Некорректный ID таблицы" });
      return;
    }

    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ message: "Новое название обязательно" });
      return;
    }

    const table = await storage.renameBotTable(tableId, name);
    if (!table) {
      res.status(404).json({ message: "Таблица не найдена" });
      return;
    }

    res.json(table);
  } catch (error) {
    console.error("[renameTableHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось переименовать таблицу" });
  }
}
