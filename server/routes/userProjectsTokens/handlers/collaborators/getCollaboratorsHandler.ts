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
import { getBotActorId } from "../../../../middleware/bot-api-actor";

/**
 * Возвращает список коллабораторов проекта.
 *
 * @param req - Запрос с query-параметром telegram_id и params.id (project_id)
 * @param res - Ответ: { items: [...], count: N } или ошибка
 * @returns {Promise<void>}
 */
export async function getCollaboratorsHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = getBotActorId(req);
        const projectId = parseInt(req.params.id, 10);

        if (telegramId === null) {
            res.status(401).json({ error: "UNAUTHORIZED" });
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
