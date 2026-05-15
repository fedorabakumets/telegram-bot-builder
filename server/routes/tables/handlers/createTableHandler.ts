/**
 * @fileoverview Хендлер создания таблицы проекта
 * @module routes/tables/handlers/createTableHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает POST /api/projects/:id/tables
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function createTableHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: "Некорректный ID проекта" });
      return;
    }

    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ message: "Название таблицы обязательно" });
      return;
    }

    const table = await storage.createBotTable({ projectId, name });
    res.status(201).json(table);
  } catch (error) {
    console.error("[createTableHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось создать таблицу" });
  }
}
