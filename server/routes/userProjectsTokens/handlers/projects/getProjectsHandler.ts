/**
 * @fileoverview Хендлер получения проектов пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка проектов пользователя.
 *
 * @module userProjectsTokens/handlers/projects/getProjectsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на получение проектов
 *
 * @function getProjectsHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getProjectsHandler(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ error: "Пользователь не аутентифицирован" });
            return;
        }

        const projects = await storage.getUserBotProjects(userId);
        res.json(projects);
    } catch (error: any) {
        console.error("Ошибка получения проектов:", error);
        res.status(500).json({ error: "Не удалось получить проекты" });
    }
}
