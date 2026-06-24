/**
 * @fileoverview Хендлер переупорядочивания проектов владельца.
 * После сохранения нового порядка вещает projects-changed на owner-канал,
 * чтобы открытый список проектов обновился в реальном времени.
 * @module projectRoutes/handlers/reorderProjectsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { getOwnerIdFromRequest } from "../../../telegram/auth-middleware";
import { broadcastProjectsChanged } from "../../../terminal/broadcastProjectsChanged";

/**
 * Обрабатывает запрос на переупорядочивание проектов
 * @param req - Объект запроса (тело: { projectIds: number[] })
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function reorderProjectsHandler(req: Request, res: Response): Promise<void> {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds) || projectIds.some((id) => typeof id !== 'number')) {
      res.status(400).json({ message: 'Неверный ID проекта' });
      return;
    }

    await storage.reorderBotProjects(projectIds);

    // Live-обновление порядка проектов во всех открытых вкладках владельца
    try {
      const ownerId = getOwnerIdFromRequest(req);
      if (ownerId != null) {
        broadcastProjectsChanged(ownerId, 'reordered');
      }
    } catch (err) {
      console.error("[reorderProjectsHandler] Ошибка broadcast projects-changed:", err);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Ошибка переупорядочивания проектов:", error);
    res.status(500).json({ message: "Не удалось переупорядочить проекты" });
  }
}
