/**
 * @fileoverview Хендлер обновления проекта пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на обновление проекта пользователя.
 *
 * @module userProjectsTokens/handlers/projects/updateProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на обновление проекта
 *
 * @function updateProjectHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function updateProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        const projectId = parseInt(req.params.id);

        if (!userId) {
            res.status(401).json({ error: "Пользователь не аутентифицирован" });
            return;
        }

        const project = await storage.getBotProject(projectId);
        if (!project || project.ownerId !== userId) {
            res.status(403).json({ error: "Доступ запрещён" });
            return;
        }

        const updated = await storage.updateBotProject(projectId, req.body);
        res.json(updated);
    } catch (error: any) {
        console.error("Ошибка обновления проекта:", error);
        res.status(500).json({ error: "Не удалось обновить проект" });
    }
}
