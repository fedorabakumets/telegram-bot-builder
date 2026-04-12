/**
 * @fileoverview Хендлер получения проектов пользователя по Telegram ID
 *
 * Используется ботами для получения списка проектов пользователя.
 * Идентификация происходит по telegram_id, который бот передаёт в query-параметре.
 * Эндпоинт не требует браузерной сессии.
 *
 * @module userProjectsTokens/handlers/projects/getBotProjectsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Возвращает список проектов пользователя по его Telegram ID.
 * Предназначен для вызова из Telegram-бота.
 *
 * @param req - Запрос с query-параметром telegram_id
 * @param res - Ответ: массив проектов [{id, name, description, ...}]
 * @returns {Promise<void>}
 */
export async function getBotProjectsHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = Number(req.query.telegram_id);

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        const projects = await storage.getUserBotProjects(telegramId);

        // Возвращаем только безопасные поля — без data и botToken
        const safeProjects = projects.map(({ id, name, description, createdAt, updatedAt, sortOrder }) => ({
            id,
            name,
            description,
            createdAt,
            updatedAt,
            sortOrder,
        }));

        res.json(safeProjects);
    } catch (error: any) {
        console.error("Ошибка получения проектов бота:", error);
        res.status(500).json({ error: "Не удалось получить проекты" });
    }
}
