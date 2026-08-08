/**
 * @fileoverview Хендлер добавления коллаборатора к проекту
 *
 * Добавляет пользователя как коллаборатора проекта.
 * Владелец и любой коллаборатор могут добавлять новых участников.
 * Если пользователь не существует в telegram_users — создаёт его.
 *
 * @module userProjectsTokens/handlers/collaborators/addCollaboratorHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { getBotActorId } from "../../../../middleware/bot-api-actor";

/**
 * Добавляет коллаборатора к проекту.
 * Владелец и любой коллаборатор могут выполнять это действие.
 * Пользователь может добавить себя обратно, если был удалён.
 *
 * @param req - Запрос с query-параметром telegram_id, params.id и body { user_id: number }
 * @param res - Ответ: { success: true } или ошибка
 * @returns {Promise<void>}
 */
export async function addCollaboratorHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = getBotActorId(req);
        const projectId = parseInt(req.params.id, 10);
        const userId = Number(req.body?.user_id);

        if (telegramId === null) {
            res.status(401).json({ error: "UNAUTHORIZED" });
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

        // Проверяем доступ: владелец или коллаборатор
        const hasAccess = await storage.hasProjectAccess(projectId, telegramId);
        if (!hasAccess) {
            res.status(403).json({ error: "Нет доступа к этому проекту" });
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
