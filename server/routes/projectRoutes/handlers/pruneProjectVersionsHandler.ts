/**
 * @fileoverview Хендлер массового удаления версий проекта из истории по фильтру
 *
 * Удаляет версии проекта по фильтру (keep/kind/authorKind), возвращает число удалённых.
 * Операция необратима. Проверка доступа выполняется middleware requireProjectAccess.
 *
 * @module projectRoutes/handlers/pruneProjectVersionsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { broadcastVersionsChanged } from '../../../canvas/broadcastVersionsChanged';

/**
 * Обрабатывает запрос на массовое удаление версий проекта
 * @param req - Объект запроса (params: id проекта; body: keep, kind, authorKind)
 * @param res - Объект ответа (JSON { deleted: number })
 * @returns Promise<void>
 */
export async function pruneProjectVersionsHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        if (isNaN(projectId) || !projectId) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const { keep, kind, authorKind } = (req.body ?? {}) as {
            keep?: number;
            kind?: "auto" | "manual";
            authorKind?: "agent" | "user";
        };

        const deleted = await storage.deleteProjectVersionsBulk(projectId, { keep, kind, authorKind });
        broadcastVersionsChanged(projectId);
        res.json({ deleted });
    } catch (error) {
        console.error("Ошибка массового удаления версий проекта:", error);
        res.status(500).json({ message: "Не удалось удалить версии проекта", error: (error as Error).message });
    }
}
