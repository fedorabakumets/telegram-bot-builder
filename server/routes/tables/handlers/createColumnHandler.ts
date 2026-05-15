/**
 * @fileoverview Хендлер создания колонки таблицы
 * @module routes/tables/handlers/createColumnHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает POST /api/projects/:id/tables/:tableId/columns
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function createColumnHandler(req: Request, res: Response): Promise<void> {
  try {
    const tableId = parseInt(req.params.tableId, 10);
    if (isNaN(tableId)) {
      res.status(400).json({ message: "Некорректный ID таблицы" });
      return;
    }

    const { name, position } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ message: "Название колонки обязательно" });
      return;
    }

    const column = await storage.createBotTableColumn({
      tableId,
      name,
      position: typeof position === "number" ? position : 0,
    });
    res.status(201).json(column);
  } catch (error) {
    console.error("[createColumnHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось создать колонку" });
  }
}
