/**
 * @fileoverview Хендлер получения токенов проекта через Telegram-бота
 *
 * Возвращает список токенов проекта по telegram_id пользователя.
 * Проверяет принадлежность проекта пользователю.
 * Не требует браузерной сессии.
 * Включает поле botStatus для каждого токена — эмодзи-индикатор статуса бота.
 *
 * @module userProjectsTokens/handlers/tokens/getBotProjectTokensHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Возвращает эмодзи-индикатор статуса бота по статусу instance.
 * @param status - Статус instance ("running", "stopped", "error") или null
 * @returns Эмодзи: 🟢 running, 🔴 stopped/error, ⚪ нет instance
 */
function getBotStatusEmoji(status: string | null | undefined): string {
    if (status === 'running') return '🟢';
    if (status === 'error') return '🔴';
    return '⚪';
}

/**
 * Форматирует число с разделителями тысяч
 */
function formatNumber(num: number): string {
    return num.toLocaleString('ru-RU');
}

/**
 * Возвращает токены проекта для Telegram-бота.
 * Показывает: id, name, botUsername, botFirstName, isDefault, isActive, botStatus.
 * botStatus — эмодзи-индикатор: 🟢 запущен, 🔴 ошибка, ⚪ остановлен/нет данных.
 *
 * @param req - query: telegram_id, params: id (project_id или "project_42")
 * @param res - массив токенов с полем botStatus
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

        // Загружаем статусы всех токенов параллельно
        const instances = await Promise.all(
            tokens.map(t => storage.getBotInstanceByToken(t.id).catch(() => null))
        );

        // Загружаем статистику для каждого токена
        const stats = await Promise.all(
            tokens.map(t => storage.getTokenUserStats(t.id).catch(() => ({
                total_users: 0,
                active_24h: 0,
                active_7d: 0,
                new_today: 0,
            })))
        );

        const result = tokens.map((t, i) => ({
            id: t.id,
            name: t.name,
            botUsername: t.botUsername ?? null,
            botFirstName: t.botFirstName ?? null,
            isDefault: t.isDefault,
            isActive: t.isActive,
            botStatus: getBotStatusEmoji(instances[i]?.status),
            token: t.token, // на этапе разработки
            userStats: {
                total: formatNumber(stats[i].total_users),
                active_24h: formatNumber(stats[i].active_24h),
                active_7d: formatNumber(stats[i].active_7d),
                new_today: formatNumber(stats[i].new_today),
            },
        }));

        res.json({ items: result, count: result.length });
    } catch (error: any) {
        console.error("Ошибка получения токенов проекта через бота:", error);
        res.status(500).json({ error: "Не удалось получить токены" });
    }
}

