/**
 * @fileoverview Хендлер получения токенов проекта через Telegram-бота
 *
 * Возвращает список токенов проекта по telegram_id пользователя.
 * Проверяет принадлежность проекта пользователю.
 * Не требует браузерной сессии.
 *
 * @module userProjectsTokens/handlers/tokens/getBotProjectTokensHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Возвращает токены проекта для Telegram-бота.
 * Показывает: id, name, botUsername, isDefault, isActive.
 * Токен (строка) не возвращается в целях безопасности на проде,
 * но на этапе разработки включён для удобства.
 *
 * @param req - query: telegram_id, params: id (project_id или "project_42")
 * @param res - массив токенов
 * @returns {Promise<void>}
 */
export async function getBotProjectTokensHandler(req: Request, res: Response): Promise<void> {
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

        const project = await storage.getBotProject(projectId);
        if (!project) {
            res.status(404).json({ error: "Проект не найден" });
            return;
        }

        if (project.ownerId !== telegramId) {
            res.status(403).json({ error: "Нет доступа к этому проекту" });
            return;
        }

        const tokens = await storage.getBotTokensByProject(projectId);

        const result = tokens.map(t => ({
            id: t.id,
            name: t.name,
            botUsername: t.botUsername ?? null,
            botFirstName: t.botFirstName ?? null,
            isDefault: t.isDefault,
            isActive: t.isActive,
            token: t.token, // на этапе разработки
        }));

        res.json({ items: result, count: result.length });
    } catch (error: any) {
        console.error("Ошибка получения токенов проекта через бота:", error);
        res.status(500).json({ error: "Не удалось получить токены" });
    }
}
