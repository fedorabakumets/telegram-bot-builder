/**
 * @fileoverview Хендлер удаления проекта через Telegram-бота
 *
 * Позволяет боту удалить проект от имени пользователя.
 * Идентификация через telegram_id в query-параметре — без браузерной сессии.
 * Проверяет наличие доступа к проекту (владелец или коллаборатор) перед удалением.
 *
 * @module userProjectsTokens/handlers/projects/deleteBotProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает DELETE-запрос на удаление проекта через Telegram-бота.
 * Доступно владельцу и коллабораторам проекта.
 *
 * @param req - Запрос с query-параметром telegram_id и params.id
 * @param res - Ответ: { success: true } или ошибка
 * @returns {Promise<void>}
 */
export async function deleteBotProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = Number(req.query.telegram_id);
        const projectId = parseInt(req.params.id, 10);

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        if (isNaN(projectId)) {
            res.status(400).json({ error: "Некорректный project_id" });
            return;
        }

        const project = await storage.getBotProject(projectId);

        if (!project) {
            res.status(404).json({ error: "Проект не найден" });
            return;
        }

        // Проверяем доступ: владелец или коллаборатор
        const hasAccess = await storage.hasProjectAccess(projectId, telegramId);
        if (!hasAccess) {
            res.status(403).json({ error: "Нет доступа к этому проекту" });
            return;
        }

        await storage.deleteBotProject(projectId);

        res.json({ success: true });
    } catch (error: any) {
        console.error("Ошибка удаления проекта через бота:", error);
        res.status(500).json({ error: "Не удалось удалить проект" });
    }
}
