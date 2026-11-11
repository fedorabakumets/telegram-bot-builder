/**
 * @fileoverview Хендлер восстановления проекта из версии (откат)
 *
 * Записывает снимок выбранной версии обратно в проект и синхронизирует
 * таблицу _content. Проверка доступа выполняется middleware requireProjectAccess.
 *
 * @module projectRoutes/handlers/restoreProjectVersionHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { updateProjectHandler } from "./updateProjectHandler";

/**
 * Обрабатывает запрос на восстановление проекта из версии
 * @param req - Объект запроса
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function restoreProjectVersionHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const versionId = parseInt(req.params.versionId);
        if (isNaN(projectId) || !projectId || isNaN(versionId) || !versionId) {
            res.status(400).json({ message: "Неверный ID проекта или версии" });
            return;
        }

        const version = await storage.getProjectVersion(versionId, projectId);
        if (!version || version.projectId !== projectId) {
            res.status(404).json({ message: "Версия не найдена" });
            return;
        }

        // Общий путь обеспечивает историю, квитанцию и одинаковые побочные эффекты.
        const current = await storage.getBotProject(projectId);
        if (!current) { res.status(404).json({ message: "Проект не найден" }); return; }
        req.body = {
            data: version.snapshot,
            expectedRevision: req.body?.expectedRevision ?? current.revision,
            agentEdit: req.body?.agentEdit === true,
            agentSessionId: req.body?.agentSessionId,
            agentDisplayName: req.body?.agentDisplayName,
            commitMessage: `Откат к версии #${versionId}`,
        };
        await updateProjectHandler(req, res);
    } catch (error) {
        console.error("Ошибка восстановления версии проекта:", error);
        res.status(503).json({ message: "Не удалось прочитать снимок версии для восстановления" });
    }
}
