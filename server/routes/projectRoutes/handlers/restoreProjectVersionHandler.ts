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
import type { StorageBotProjectUpdate } from "../../../storages/storageTypes";
import { syncContentToTable } from "../../../services/content-table";

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

        const version = await storage.getProjectVersion(versionId);
        if (!version || version.projectId !== projectId) {
            res.status(404).json({ message: "Версия не найдена" });
            return;
        }

        const project = await storage.updateBotProject(projectId, {
            data: version.snapshot,
        } as StorageBotProjectUpdate);
        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        // Синхронизация контента в таблицу _content
        try {
            await syncContentToTable(projectId, version.snapshot);
            const { getRedisPublisher } = await import("../../../redis/redisClient");
            const pub = getRedisPublisher();
            if (pub) {
                await pub.publish(`bot:table_updated:${projectId}`, "reload");
            }
        } catch (err) {
            console.error(`[restoreProjectVersionHandler] Ошибка синхронизации _content для проекта ${projectId}:`, err);
        }

        res.json(project);
    } catch (error) {
        console.error("Ошибка восстановления версии проекта:", error);
        res.status(500).json({ message: "Не удалось восстановить версию проекта", error: (error as Error).message });
    }
}
