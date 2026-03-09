/**
 * @fileoverview Хендлер получения токенов пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка токенов пользователя.
 *
 * @module userProjectsTokens/handlers/tokens/getTokensHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на получение токенов
 *
 * @function getTokensHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getTokensHandler(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ error: "Пользователь не аутентифицирован" });
            return;
        }

        const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
        const tokens = await storage.getUserBotTokens(userId, projectId);
        res.json(tokens);
    } catch (error: any) {
        console.error("Ошибка получения токенов:", error);
        res.status(500).json({ error: "Не удалось получить токены" });
    }
}
