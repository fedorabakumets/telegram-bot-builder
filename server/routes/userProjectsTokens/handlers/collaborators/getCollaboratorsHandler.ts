/**
 * @fileoverview Хендлер получения списка коллабораторов проекта
 *
 * Возвращает список коллабораторов проекта.
 * Доступен владельцу и любому коллаборатору проекта.
 *
 * @module userProjectsTokens/handlers/collaborators/getCollaboratorsHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Возвращает список коллабораторов проекта.
 *
 * @param req - Запрос с query-параметром telegram_id и params.id (project_id)
 * @param res - Ответ: { items: [...], count: N } или ошибка
 * @returns {Promise<void>}
 */
export async function getCollaboratorsHandler(req: Request, res: Response): Promise<void> {
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
        if (!(await storage.hasProjectAccess(projectId, telegramId))) {
            res.status(403).json({ error: "Нет доступа к этому проекту" });
            return;
        }

        const items = await storage.getCollaborators(projectId);

        res.json({ items, count: items.length });
    } catch (error: any) {
        console.error("Ошибка получения коллабораторов проекта:", error);
        res.status(500).json({ error: "Не удалось получить коллабораторов" });
    }
}
