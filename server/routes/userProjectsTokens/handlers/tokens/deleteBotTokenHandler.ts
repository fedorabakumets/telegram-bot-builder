/**
 * @fileoverview Хендлер удаления токена бота через Telegram-бота
 *
 * Позволяет боту удалить токен по его идентификатору от имени пользователя.
 * Идентификация происходит по telegram_id в query-параметре — без браузерной сессии.
 * Проверяет наличие доступа к проекту токена (владелец или коллаборатор) перед удалением.
 *
 * @module userProjectsTokens/handlers/tokens/deleteBotTokenHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает DELETE-запрос на удаление токена бота через Telegram-бота.
 * Доступно владельцу и коллабораторам проекта.
 *
 * @param req - Запрос с query-параметром telegram_id и params.tokenId
 * @param res - Ответ: { success: true } или ошибка
 * @returns {Promise<void>}
 */
export async function deleteBotTokenHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = Number(req.query.telegram_id);
        const raw = req.params.tokenId;

        // Извлекаем числовой id из строки вида "token_42" или просто "42"
        const match = raw.match(/(\d+)$/);
        const tokenId = match ? parseInt(match[1], 10) : NaN;

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        if (isNaN(tokenId)) {
            res.status(400).json({ error: "Некорректный tokenId" });
            return;
        }

        // Получаем токен для проверки принадлежности
        const token = await storage.getBotToken(tokenId);
        if (!token) {
            res.status(404).json({ error: "Токен не найден" });
            return;
        }

        // Проверяем доступ к проекту: владелец или коллаборатор
        const hasAccess = await storage.hasProjectAccess(token.projectId, telegramId);
        if (!hasAccess) {
            res.status(403).json({ error: "Нет доступа к этому токену" });
            return;
        }

        await storage.deleteBotToken(tokenId);

        res.json({ success: true });
    } catch (error: any) {
        console.error("Ошибка удаления токена через бота:", error);
        res.status(500).json({ error: "Не удалось удалить токен" });
    }
}
