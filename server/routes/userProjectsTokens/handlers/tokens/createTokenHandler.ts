/**
 * @fileoverview Хендлер создания токена пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на создание нового токена пользователя.
 *
 * @module userProjectsTokens/handlers/tokens/createTokenHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на создание токена
 *
 * @function createTokenHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function createTokenHandler(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ error: "Пользователь не аутентифицирован" });
            return;
        }

        const token = await storage.createBotToken({
            ...req.body,
            ownerId: userId
        });
        res.json(token);
    } catch (error: any) {
        console.error("Ошибка создания токена:", error);
        res.status(500).json({ error: "Не удалось создать токен" });
    }
}
