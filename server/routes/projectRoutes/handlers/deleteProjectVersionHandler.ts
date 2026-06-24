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

        const version = await storage.getProjectVersion(versionId);
        if (!version || version.projectId !== projectId) {
            res.status(404).json({ message: "Версия не найдена" });
            return;
        }

        const deleted = await storage.deleteProjectVersion(projectId, versionId);
        res.json({ deleted });
    } catch (error) {
        console.error("Ошибка удаления версии проекта:", error);
        res.status(500).json({ message: "Не удалось удалить версию проекта", error: (error as Error).message });
    }
}
