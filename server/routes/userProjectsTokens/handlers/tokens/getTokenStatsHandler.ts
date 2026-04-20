/**
 * @fileoverview Хендлер получения статистики пользователей токена
 *
 * Возвращает статистику пользователей для конкретного токена:
 * - total_users: общее количество пользователей
 * - active_24h: активных за последние 24 часа
 * - active_7d: активных за последние 7 дней
 * - new_today: новых сегодня
 *
 * @module userProjectsTokens/handlers/tokens/getTokenStatsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Возвращает статистику пользователей токена
 *
 * @param req - params: tokenId
 * @param res - объект со статистикой
 * @returns {Promise<void>}
 */
export async function getTokenStatsHandler(req: Request, res: Response): Promise<void> {
    try {
        const { tokenId } = req.params;
        const token = Number(tokenId);

        if (isNaN(token)) {
            res.status(400).json({ error: "Некорректный tokenId" });
            return;
        }

        // Проверяем что токен существует
        const tokenRecord = await storage.getBotToken(Number(tokenId));
        if (!tokenRecord) {
            res.status(404).json({ error: "Токен не найден" });
            return;
        }

        // Получаем статистику из БД
        const stats = await storage.getTokenUserStats(Number(tokenId));

        res.json(stats);
    } catch (error: any) {
        console.error("Ошибка получения статистики токена:", error);
        res.status(500).json({ error: "Не удалось получить статистику" });
    }
}
