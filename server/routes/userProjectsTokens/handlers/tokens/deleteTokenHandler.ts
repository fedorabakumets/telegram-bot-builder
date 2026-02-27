/**
 * @fileoverview Хендлер удаления токена пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на удаление токена пользователя.
 *
 * @module userProjectsTokens/handlers/tokens/deleteTokenHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на удаление токена
 *
 * @function deleteTokenHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function deleteTokenHandler(req: Request, res: Response): Promise<void> {
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

        await storage.deleteBotToken(tokenId);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Ошибка удаления токена:", error);
        res.status(500).json({ error: "Не удалось удалить токен" });
    }
}
