/**
 * @fileoverview Хендлер создания проекта через Telegram-бота
 *
 * Используется ботами для создания нового проекта от имени пользователя.
 * Идентификация происходит по telegram_id в query-параметре — без браузерной сессии.
 *
 * @module userProjectsTokens/handlers/projects/createBotProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает POST-запрос на создание проекта через Telegram-бота.
 * Принимает опциональное имя проекта, по умолчанию — «Новый проект».
 *
 * @param req - Запрос с query-параметром telegram_id и опциональным body { name }
 * @param res - Ответ: { id, name, createdAt } или ошибка
 * @returns {Promise<void>}
 */
export async function createBotProjectHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = Number(req.query.telegram_id);

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        const name: string = (req.body?.name as string) || "Новый проект";

        // Убеждаемся что пользователь существует в telegram_users (FK constraint)
        await storage.getTelegramUserOrCreate({
            id: telegramId,
            firstName: "Пользователь",
        });

        const project = await storage.createBotProject({
            ownerId: telegramId,
            name,
            description: "",
            data: { sheets: [], version: 2 },
        });

        res.status(200).json({
            id: project.id,
            name: project.name,
            createdAt: project.createdAt,
        });
    } catch (error: any) {
        console.error("Ошибка создания проекта через бота:", error);
        res.status(500).json({ error: "Не удалось создать проект" });
    }
}
