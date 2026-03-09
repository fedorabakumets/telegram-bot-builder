/**
 * @fileoverview Хендлер обновления токена пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на обновление токена пользователя.
 *
 * @module userProjectsTokens/handlers/tokens/updateTokenHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на обновление токена
 *
 * @function updateTokenHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function updateTokenHandler(req: Request, res: Response): Promise<void> {
    try {
        const userId = (req as any).user?.id;
        const tokenId = parseInt(req.params.id);

        if (!userId) {
            res.status(401).json({ error: "Пользователь не аутентифицирован" });
            return;
        }

        const token = await storage.getBotToken(tokenId);
        if (!token || token.ownerId !== userId) {
            res.status(403).json({ error: "Доступ запрещён" });
            return;
        }

        const updated = await storage.updateBotToken(tokenId, req.body);
        res.json(updated);
    } catch (error: any) {
        console.error("Ошибка обновления токена:", error);
        res.status(500).json({ error: "Не удалось обновить токен" });
    }
}
