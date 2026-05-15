/**
 * @fileoverview Хендлер обновления строки таблицы
 * @module routes/tables/handlers/updateRowHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает PUT /api/projects/:id/tables/:tableId/rows/:rowId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function updateRowHandler(req: Request, res: Response): Promise<void> {
  try {
    const rowId = parseInt(req.params.rowId, 10);
    if (isNaN(rowId)) {
      res.status(400).json({ message: "Некорректный ID строки" });
      return;
    }

    const { data } = req.body;
    if (!data || typeof data !== "object") {
      res.status(400).json({ message: "Поле data обязательно и должно быть объектом" });
      return;
    }

    const row = await storage.updateBotTableRow(rowId, data);
    if (!row) {
      res.status(404).json({ message: "Строка не найдена" });
      return;
    }

    res.json(row);
  } catch (error) {
    console.error("[updateRowHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось обновить строку" });
  }
}
