/**
 * @fileoverview Хендлеры операций с токеном проекта
 *
 * Этот модуль предоставляет функции для обработки запросов
 * на получение и очистку токена бота проекта.
 *
 * @module projectRoutes/handlers/tokenHandlers
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает запрос на получение информации о токене
 *
 * @function getTokenHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getTokenHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const project = await storage.getBotProject(projectId);

        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        res.json({
            hasToken: !!project.botToken,
            tokenPreview: project.botToken ? `${project.botToken.substring(0, 10)}...` : null
        });
    } catch (error) {
        res.status(500).json({ message: "Не удалось получить информацию о токене" });
    }
}

/**
 * Обрабатывает запрос на очистку токена
 *
 * @function clearTokenHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function clearTokenHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const project = await storage.updateBotProject(projectId, { botToken: null });

        if (!project) {
            res.status(404).json({ message: "Проект не найден" });
            return;
        }

        res.json({ message: "Токен успешно очищен" });
    } catch (error) {
        res.status(500).json({ message: "Не удалось очистить токен" });
    }
}
