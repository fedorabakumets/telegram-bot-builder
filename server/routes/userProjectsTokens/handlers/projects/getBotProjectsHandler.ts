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
import { getBotActorId } from "../../../../middleware/bot-api-actor";

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
        const telegramId = getBotActorId(req);
        if (telegramId === null) {
            res.status(401).json({ error: "UNAUTHORIZED" });
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

        // Возвращаем объект с массивом items и счётчиком count
        // count позволяет боту проверить пустой список через condition-узел
        res.json({
            items: safeProjects,
            count: safeProjects.length,
        });
    } catch (error: any) {
        console.error("Ошибка получения проектов бота:", error);
        res.status(500).json({ error: "Не удалось получить проекты" });
    }
}
