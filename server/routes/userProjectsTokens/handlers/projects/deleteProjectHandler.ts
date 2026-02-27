/**
 * @fileoverview Хендлер удаления проекта пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на удаление проекта пользователя.
 *
 * @module userProjectsTokens/handlers/projects/deleteProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на удаление проекта
 *
 * @function deleteProjectHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function deleteProjectHandler(req: Request, res: Response): Promise<void> {
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

        await storage.deleteBotProject(projectId);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Ошибка удаления проекта:", error);
        res.status(500).json({ error: "Не удалось удалить проект" });
    }
}
