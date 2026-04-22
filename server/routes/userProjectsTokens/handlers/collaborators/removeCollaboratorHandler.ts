/**
 * @fileoverview Хендлер удаления коллаборатора из проекта
 *
 * Удаляет пользователя из списка коллабораторов проекта.
 * Владелец и любой коллаборатор могут удалять участников.
 *
 * @module userProjectsTokens/handlers/collaborators/removeCollaboratorHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Удаляет коллаборатора из проекта.
 * Владелец и любой коллаборатор могут выполнять это действие.
 *
 * @param req - Запрос с query-параметром telegram_id, params.id и params.userId
 * @param res - Ответ: { success: true } или ошибка
 * @returns {Promise<void>}
 */
export async function removeCollaboratorHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = Number(req.query.telegram_id);
        const projectId = parseInt(req.params.id, 10);
        const userId = Number(req.params.userId);

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        if (isNaN(projectId)) {
            res.status(400).json({ error: "Некорректный project_id" });
            return;
        }

        if (isNaN(userId)) {
            res.status(400).json({ error: "Некорректный userId" });
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

        const removed = await storage.removeCollaborator(projectId, userId);

        if (!removed) {
            res.status(404).json({ error: "Коллаборатор не найден" });
            return;
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error("Ошибка удаления коллаборатора:", error);
        res.status(500).json({ error: "Не удалось удалить коллаборатора" });
    }
}
