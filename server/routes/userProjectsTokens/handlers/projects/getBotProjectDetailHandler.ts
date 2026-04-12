/**
 * @fileoverview Хендлер получения деталей проекта для Telegram-бота
 *
 * Возвращает информацию о конкретном проекте + статус запущенного бота.
 * Проверяет что проект принадлежит пользователю по telegram_id.
 * Не требует браузерной сессии.
 *
 * @module userProjectsTokens/handlers/projects/getBotProjectDetailHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Возвращает детали проекта и статус бота по project_id и telegram_id.
 *
 * @param req - query: telegram_id, params: id (project id)
 * @param res - { id, name, description, botStatus: 'running'|'stopped'|'unknown' }
 */
export async function getBotProjectDetailHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const telegramId = Number(req.query.telegram_id);

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

        // Проверяем что проект принадлежит этому пользователю
        if (project.ownerId !== telegramId) {
            res.status(403).json({ error: "Нет доступа к этому проекту" });
            return;
        }

        // Получаем статус бота
        const instance = await storage.getBotInstance(projectId);
        const botStatus = instance?.status ?? "unknown";

        res.json({
            id: project.id,
            name: project.name,
            description: project.description,
            botStatus,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        });
    } catch (error: any) {
        console.error("Ошибка получения деталей проекта:", error);
        res.status(500).json({ error: "Не удалось получить детали проекта" });
    }
}
