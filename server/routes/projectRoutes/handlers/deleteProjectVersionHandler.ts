/**
 * @fileoverview Хендлер удаления одной версии проекта из истории
 *
 * Удаляет версию по id с проверкой принадлежности проекту. Операция необратима.
 * Проверка доступа выполняется middleware requireProjectAccess.
 *
 * @module projectRoutes/handlers/deleteProjectVersionHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { broadcastVersionsChanged } from '../../../canvas/broadcastVersionsChanged';

/**
 * Обрабатывает запрос на удаление одной версии проекта
 * @param req - Объект запроса (params: id проекта, versionId версии)
 * @param res - Объект ответа (JSON { deleted: boolean })
 * @returns Promise<void>
 */
export async function deleteProjectVersionHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const versionId = parseInt(req.params.versionId);
        if (isNaN(projectId) || !projectId || isNaN(versionId) || !versionId) {
            res.status(400).json({ message: "Неверный ID проекта или версии" });
            return;
        }

        /** Принадлежность версии проверяется непосредственно при удалении в SQL. */
        const deleted = await storage.deleteProjectVersion(projectId, versionId);
        if (!deleted) { res.status(404).json({ message: "Версия уже удалена" }); return; }
        try { broadcastVersionsChanged(projectId); } catch { /* Уведомление не отменяет сохранённое удаление. */ }
        res.json({ deleted, effect: "application", outcome: "saved", persistence: { confirmed: true, method: "returning", projectId, versionId } });
    } catch (error) {
        console.error("Ошибка удаления версии проекта:", error);
        res.status(500).json({ message: "Не удалось удалить версию проекта", error: (error as Error).message });
    }
}
