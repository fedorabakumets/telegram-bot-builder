/**
 * @fileoverview Обработчик поиска пользователя по username или ID
 *
 * @module botIntegration/user/searchUser
 */

import type { Request, Response } from "express";
import { storage } from "../../storages/storage";

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
        const localUserBotData = await storage.searchUserBotData(projectId, query);
        const localBotUsers = await storage.searchBotUsers(query);

        // Проверяем user_bot_data (специфично для проекта)
        if (localUserBotData && localUserBotData.length > 0) {
            const user = localUserBotData[0];
            res.json({
                success: true,
                user: {
                    id: parseInt(user.userId),
                    first_name: user.firstName,
                    last_name: user.lastName,
                    username: user.userName,
                    type: 'private'
                },
                userId: user.userId,
                source: 'local_project'
            });
            return;
        }

        // Проверяем bot_users (глобальная таблица пользователей)
        if (localBotUsers && localBotUsers.length > 0) {
            const user = localBotUsers[0];
            res.json({
                success: true,
                user: {
                    id: user.userId,
                    first_name: user.firstName,
                    last_name: user.lastName,
                    username: user.username,
                    type: 'private'
                },
                userId: user.userId.toString(),
                source: 'local_global'
            });
            return;
        }

        // Если не найден в локальной базе, пробуем через Telegram API
        const userId = await resolveUserId(defaultToken.token, query);

        if (!userId) {
            res.status(404).json({
                message: "Пользователь не найден",
                error: "Пользователь не найден ни в локальной базе данных, ни через Telegram API. Убедитесь, что пользователь взаимодействовал с ботом или имеет публичный username."
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

/**
 * Определяет ID пользователя по запросу (username или numeric ID)
 *
 * @param {string} token - Токен бота
 * @param {string} query - Поисковый запрос (username или ID)
 * @returns {Promise<string | null>} ID пользователя или null
 */
async function resolveUserId(token: string, query: string): Promise<string | null> {
    // Если числовой ID - возвращаем как есть
    if (/^\d+$/.test(query)) {
        return query;
    }

    // Если username - пробуем получить через @username
    const username = query.startsWith('@') ? query.slice(1) : query;

    try {
        const chatResponse = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: `@${username}`
            })
        });

        const chatResult = await chatResponse.json();
        if (chatResponse.ok && chatResult.result && chatResult.result.id) {
            return chatResult.result.id.toString();
        }
    } catch (error) {
        console.log('Поиск по username не удался, у пользователя может не быть публичного username');
    }

    return null;
}

/**
 * Получает информацию о пользователе через Telegram API
 *
 * @param {string} token - Токен бота
 * @param {string} userId - ID пользователя
 * @returns {Promise<{ success: boolean; data?: any; error?: string }>}
 */
async function getTelegramUser(token: string, userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const userResponse = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: userId
            })
        });

        const userResult = await userResponse.json();

        if (!userResponse.ok) {
            return {
                success: false,
                error: userResult.description || "Неизвестная ошибка"
            };
        }

        return {
            success: true,
            data: userResult.result
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || "Неизвестная ошибка"
        };
    }
}
