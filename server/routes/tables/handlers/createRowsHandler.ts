/**
 * @fileoverview Хендлер создания строк таблицы (батч)
 * @module routes/tables/handlers/createRowsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает POST /api/projects/:id/tables/:tableId/rows
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function createRowsHandler(req: Request, res: Response): Promise<void> {
  try {
    const tableId = parseInt(req.params.tableId, 10);
    if (isNaN(tableId)) {
      res.status(400).json({ message: "Некорректный ID таблицы" });
      return;
    }

    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ message: "Массив rows обязателен и не может быть пустым" });
      return;
    }

    const inputs = rows.map((row: { rowIndex?: number; data?: Record<string, string> }, idx: number) => ({
      tableId,
      rowIndex: typeof row.rowIndex === "number" ? row.rowIndex : idx,
      data: row.data ?? {},
    }));

    const created = await storage.createBotTableRows(inputs);
    res.status(201).json(created);
  } catch (error) {
    console.error("[createRowsHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось создать строки" });
  }
}
