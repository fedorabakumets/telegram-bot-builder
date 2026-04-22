/**
 * @fileoverview Хендлер добавления коллаборатора к проекту
 *
 * Добавляет пользователя как коллаборатора проекта.
 * Только владелец проекта может добавлять коллабораторов.
 * Если пользователь не существует в telegram_users — создаёт его.
 *
 * @module userProjectsTokens/handlers/collaborators/addCollaboratorHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Добавляет коллаборатора к проекту.
 * Только владелец может выполнять это действие.
 *
 * @param req - Запрос с query-параметром telegram_id, params.id и body { user_id: number }
 * @param res - Ответ: { success: true } или ошибка
 * @returns {Promise<void>}
 */
export async function addCollaboratorHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = Number(req.query.telegram_id);
        const projectId = parseInt(req.params.id, 10);
        const userId = Number(req.body?.user_id);

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        if (isNaN(projectId)) {
            res.status(400).json({ error: "Некорректный project_id" });
            return;
        }

        if (!userId || isNaN(userId)) {
            res.status(400).json({ error: "Поле user_id обязательно" });
            return;
        }

        const project = await storage.getBotProject(projectId);
        if (!project) {
            res.status(404).json({ error: "Проект не найден" });
            return;
        }

        // Только владелец может добавлять коллабораторов
        if (project.ownerId !== telegramId) {
            res.status(403).json({ error: "Только владелец может добавлять коллабораторов" });
            return;
        }

        // Нельзя добавить самого себя
        if (userId === telegramId) {
            res.status(400).json({ error: "Нельзя добавить владельца как коллаборатора" });
            return;
        }

        // Убеждаемся что пользователь существует в telegram_users
        await storage.getTelegramUserOrCreate({
            id: userId,
            firstName: String(userId),
        });

        await storage.addCollaborator(projectId, userId, telegramId);

        res.json({ success: true });
    } catch (error: any) {
        console.error("Ошибка добавления коллаборатора:", error);
        res.status(500).json({ error: "Не удалось добавить коллаборатора" });
    }
}
