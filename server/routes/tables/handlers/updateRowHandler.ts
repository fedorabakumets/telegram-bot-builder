/**
 * @fileoverview Хендлер обновления строки таблицы
 * @module routes/tables/handlers/updateRowHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { syncTableToScenario } from "../../../services/content-table";

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

    // Обратная синхронизация: если это таблица _content — обновить JSON сценария
    const projectId = parseInt(req.params.id, 10);
    const tableId = parseInt(req.params.tableId, 10);
    if (!isNaN(projectId) && !isNaN(tableId)) {
      try {
        const tables = await storage.getBotTables(projectId);
        const contentTable = tables.find((t) => t.name === "_content");
        if (contentTable && contentTable.id === tableId) {
          await syncTableToScenario(projectId, tableId, data);
          // Мгновенное уведомление бота через Redis pub/sub
          try {
            const { getRedisPublisher } = await import("../../../redis/redisClient");
            const pub = getRedisPublisher();
            if (pub) {
              await pub.publish(`bot:content_updated:${projectId}`, "reload");
            }
          } catch {}
        }
      } catch (err) {
        console.error("[updateRowHandler] Ошибка обратной синхронизации _content:", err);
      }
    }
  } catch (error) {
    console.error("[updateRowHandler] Ошибка:", error);
    res.status(500).json({ message: "Не удалось обновить строку" });
  }
}
