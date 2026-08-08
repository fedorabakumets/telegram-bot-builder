/**
 * @fileoverview Хендлер переименования проекта через Telegram-бота
 *
 * Позволяет боту обновить название проекта от имени пользователя.
 * Идентификация через telegram_id в query-параметре — без браузерной сессии.
 * Проверяет принадлежность проекта пользователю перед обновлением.
 *
 * @module userProjectsTokens/handlers/projects/updateBotProjectHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getBotActorId } from "../../../../middleware/bot-api-actor";

/**
 * Обрабатывает PATCH-запрос на переименование проекта через Telegram-бота.
 *
 * @param req - Запрос с query-параметром telegram_id, params.id и body { name }
 * @param res - Ответ: { id, name, updatedAt } или ошибка
 * @returns {Promise<void>}
 */
export async function updateBotProjectHandler(req: Request, res: Response): Promise<void> {
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

        const name: string | undefined = req.body?.name;
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            res.status(400).json({ error: "Поле name обязательно" });
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

        const updated = await storage.updateBotProject(projectId, { name: name.trim() });

        res.json({
            id: updated!.id,
            name: updated!.name,
            updatedAt: updated!.updatedAt,
        });
    } catch (error: any) {
        console.error("Ошибка переименования проекта через бота:", error);
        res.status(500).json({ error: "Не удалось переименовать проект" });
    }
}
