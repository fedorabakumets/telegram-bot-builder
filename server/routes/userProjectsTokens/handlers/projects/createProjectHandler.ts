/**
 * @fileoverview Хендлер создания проекта пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на создание нового проекта пользователя.
 *
 * @module userProjectsTokens/handlers/projects/createProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на создание проекта
 *
 * @function createProjectHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function createProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ error: "Пользователь не аутентифицирован" });
            return;
        }

        const { name, description, data, botToken, userDatabaseEnabled } = req.body;
        const project = await storage.createBotProject({
            ownerId: userId,
            name,
            description,
            data,
            botToken,
            userDatabaseEnabled
        });
        res.json(project);
    } catch (error: any) {
        console.error("Ошибка создания проекта:", error);
        res.status(500).json({ error: "Не удалось создать проект" });
    }
}
