/**
 * @fileoverview Хендлер создания токена бота через Telegram-бота
 *
 * Валидирует формат токена, вызывает Telegram getMe для автозаполнения
 * имени бота, затем сохраняет токен в базу данных.
 * Идентификация происходит по telegram_id в query-параметре — без браузерной сессии.
 *
 * @module userProjectsTokens/handlers/tokens/createBotTokenHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../utils/telegram-proxy";

/** Регулярное выражение для проверки формата токена Telegram */
const TOKEN_REGEX = /^\d+:[A-Za-z0-9_-]{35,}$/;

/**
 * Обрабатывает POST-запрос на создание токена бота через Telegram-бота.
 * Валидирует формат токена, получает имя бота через getMe и сохраняет токен.
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

        // Проверяем формат токена Telegram: {digits}:{alphanumeric}
        if (!TOKEN_REGEX.test(tokenValue)) {
            res.status(400).json({ error: "Неверный формат токена. Токен должен быть вида 123456789:ABCdef..." });
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

        // Проверяем токен через Telegram API и получаем данные бота
        let botFirstName: string | null = null;
        let botUsername: string | null = null;
        try {
            const resp = await fetchWithProxy(
                `https://api.telegram.org/bot${tokenValue}/getMe`,
                { signal: AbortSignal.timeout(8000) },
            );
            if (resp.ok) {
                const data = await resp.json();
                if (data.ok && data.result) {
                    botFirstName = data.result.first_name ?? null;
                    botUsername = data.result.username ?? null;
                }
            } else {
                res.status(400).json({ error: "Токен недействителен. Проверьте токен у @BotFather." });
                return;
            }
        } catch {
            // Если Telegram недоступен — сохраняем без имени
        }

        const token = await storage.createBotToken({
            projectId,
            ownerId: telegramId,
            token: tokenValue,
            name: botUsername ? `@${botUsername}` : name,
            isDefault: 1,
            botFirstName: botFirstName ?? undefined,
            botUsername: botUsername ?? undefined,
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
