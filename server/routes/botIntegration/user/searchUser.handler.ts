/**
 * @fileoverview Обработчик поиска пользователя по username или ID
 *
 * @module botIntegration/user/searchUser
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { resolveUserId } from "./utils/resolveUserId";
import { getTelegramUser } from "./utils/getTelegramUser";
import { searchLocalDatabase } from "./utils/searchLocalDatabase";

/**
 * Поиск пользователя по username или ID
 *
 * @function searchUserHandler
 * @param {Request} req - Запрос Express
 * @param {Response} res - Ответ Express
 * @returns {Promise<void>}
 *
 * @description
 * Ищет пользователя в следующем порядке:
 * 1. user_bot_data (специфично для проекта)
 * 2. bot_users (глобальная таблица)
 * 3. Telegram API (по username или ID)
 *
 * @route GET /api/projects/:projectId/bot/search-user/:query
 */
export async function searchUserHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const query = req.params.query;

        if (!query) {
            res.status(400).json({ message: "Требуется поисковый запрос" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден для этого проекта" });
            return;
        }

        // Поиск в локальной базе данных
        const localResult = searchLocalDatabase(
            await storage.searchUserBotData(projectId, query),
            await storage.searchBotUsers(query)
        );

        if (localResult.found) {
            res.json(localResult.data);
            return;
        }

        // Если не найден в локальной базе, пробуем через Telegram API
        const userId = await resolveUserId(defaultToken.token, query);

        if (!userId) {
            res.status(404).json({
                message: "Пользователь не найден",
                error: "Пользователь не найден ни в локальной базе данных, ни через Telegram API."
            });
            return;
        }

        // Получаем информацию о пользователе через Telegram API
        const userResult = await getTelegramUser(defaultToken.token, userId);

        if (!userResult.success) {
            res.status(400).json({
                message: "Не удалось получить информацию о пользователе",
                error: userResult.error || "Неизвестная ошибка"
            });
            return;
        }

        res.json({
            success: true,
            user: userResult.data,
            userId: userId,
            source: 'telegram'
        });
    } catch (error) {
        console.error("Не удалось найти пользователя:", error);
        res.status(500).json({ message: "Не удалось найти пользователя" });
    }
}
