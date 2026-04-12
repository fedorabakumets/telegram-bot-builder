/**
 * @fileoverview Хендлер создания токена бота через Telegram-бота
 *
 * Позволяет боту создать токен для указанного проекта от имени пользователя.
 * Идентификация происходит по telegram_id в query-параметре — без браузерной сессии.
 * Проверяет принадлежность проекта пользователю перед созданием.
 *
 * @module userProjectsTokens/handlers/tokens/createBotTokenHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает POST-запрос на создание токена бота через Telegram-бота.
 *
 * @param req - Запрос с query-параметром telegram_id, params.id (project_id),
 *              body: { token: string, name?: string }
 * @param res - Ответ: { id, name, projectId, createdAt } или ошибка
 * @returns {Promise<void>}
 */
export async function createBotTokenHandler(req: Request, res: Response): Promise<void> {
    try {
        const telegramId = Number(req.query.telegram_id);
        const raw = req.params.id;
        const match = raw.match(/(\d+)$/);
        const projectId = match ? parseInt(match[1], 10) : NaN;

        if (!telegramId || isNaN(telegramId)) {
            res.status(400).json({ error: "Параметр telegram_id обязателен" });
            return;
        }

        if (isNaN(projectId)) {
            res.status(400).json({ error: "Некорректный project_id" });
            return;
        }

        const tokenValue: string = req.body?.token as string;
        if (!tokenValue) {
            res.status(400).json({ error: "Поле token обязательно" });
            return;
        }

        const name: string = (req.body?.name as string) || "Основной токен";

        const project = await storage.getBotProject(projectId);
        if (!project) {
            res.status(404).json({ error: "Проект не найден" });
            return;
        }

        if (project.ownerId !== telegramId) {
            res.status(403).json({ error: "Нет доступа к этому проекту" });
            return;
        }

        const token = await storage.createBotToken({
            projectId,
            ownerId: telegramId,
            token: tokenValue,
            name,
            isDefault: 1,
        });

        res.status(200).json({
            id: token.id,
            name: token.name,
            projectId: token.projectId,
            createdAt: token.createdAt,
        });
    } catch (error: any) {
        console.error("Ошибка создания токена через бота:", error);
        res.status(500).json({ error: "Не удалось создать токен" });
    }
}
