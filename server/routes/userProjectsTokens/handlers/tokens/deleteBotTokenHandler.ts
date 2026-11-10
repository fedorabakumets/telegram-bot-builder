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
import { getBotActorId } from "../../../../middleware/bot-api-actor";
import { stopBot } from "../../../../bots/stopBot";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";
import { setBotDesiredStatus } from '../../../../bots/setBotDesiredStatus';

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
        const telegramId = getBotActorId(req);
        const raw = req.params.tokenId;

        // Извлекаем числовой id из строки вида "token_42" или просто "42"
        const match = raw.match(/(\d+)$/);
        const tokenId = match ? parseInt(match[1], 10) : NaN;

        if (telegramId === null) {
            res.status(401).json({ error: "UNAUTHORIZED" });
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

        // Не удаляем токен, пока завершение процесса не подтверждено.
        const instance = await storage.getBotInstanceByToken(tokenId);
        if (instance) await setBotDesiredStatus(instance.id, 'stopped');
        const stopped = await stopBot(token.projectId, tokenId);
        if (!stopped.success) {
            res.status(409).json({ error: "Остановка не подтверждена; токен не удалён", outcome: "unknown" });
            return;
        }

        if (!await storage.deleteBotToken(tokenId)) {
            res.status(404).json({ error: "Токен не найден" });
            return;
        }

        void broadcastProjectEvent(token.projectId, {
            type: "token-deleted", projectId: token.projectId, tokenId,
            data: { tokenId, tokenName: token.name }, timestamp: new Date().toISOString(),
        }).catch((error) => console.error("[DeleteToken] Ошибка уведомления:", error));

        res.json({ success: true });
    } catch (error: any) {
        console.error("Ошибка удаления токена через бота:", error);
        res.status(500).json({ error: "Не удалось удалить токен" });
    }
}
