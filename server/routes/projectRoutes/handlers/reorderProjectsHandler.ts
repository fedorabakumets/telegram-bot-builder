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
 * Обрабатывает запрос на переупорядочивание проектов.
 * Каждый ID должен принадлежать владельцу или быть доступен как collaborator —
 * иначе 403 (защита от IDOR по чужим projectIds).
 *
 * @param req - Объект запроса (тело: { projectIds: number[] })
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function reorderProjectsHandler(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = getOwnerIdFromRequest(req);
    if (ownerId === null) {
      res.status(401).json({ message: "Требуется авторизация через Telegram" });
      return;
    }

    const { projectIds } = req.body;

    if (
      !Array.isArray(projectIds) ||
      projectIds.length === 0 ||
      projectIds.some((id) => typeof id !== "number" || !Number.isInteger(id) || id <= 0)
    ) {
      res.status(400).json({ message: "Неверный список projectIds" });
      return;
    }

    // Нельзя менять sortOrder чужих проектов
    for (const projectId of projectIds) {
      const hasAccess = await storage.hasProjectAccess(projectId, ownerId);
      if (!hasAccess) {
        res.status(403).json({ message: "Нет прав на один или несколько проектов" });
        return;
      }
    }

    await storage.reorderBotProjects(projectIds);

    // Live-обновление порядка проектов во всех открытых вкладках владельца
    try {
      broadcastProjectsChanged(ownerId, "reordered");
    } catch (err) {
      console.error("[reorderProjectsHandler] Ошибка broadcast projects-changed:", err);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Ошибка переупорядочивания проектов:", error);
    res.status(500).json({ message: "Не удалось переупорядочить проекты" });
  }
}
