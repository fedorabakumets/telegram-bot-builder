/**
 * @fileoverview Хендлер получения аватарки пользователя или бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение аватарки через прокси.
 *
 * @module botIntegration/handlers/botData/getAvatarHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";
import { fetchWithProxy } from "../../../../utils/telegram-proxy";

/**
 * Обрабатывает запрос на получение аватарки пользователя или бота
 *
 * @function getAvatarHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getAvatarHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);
        const userId = req.params.userId;

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.status(400).json({ message: "Токен бота не найден" });
            return;
        }

        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        // Проверяем, это аватарка бота или пользователя
        const isBotAvatar = userId === 'bot' || userId === defaultToken.token.split(':')[0];

        let avatarUrl: string | null = null;

        if (isBotAvatar) {
            // Получаем аватарку бота из bot_tokens
            const botResult = await pool.query(
                'SELECT bot_photo_url FROM bot_tokens WHERE id = $1',
                [defaultToken.id]
            );
            avatarUrl = botResult.rows[0]?.bot_photo_url || null;
        } else {
            // Сначала пробуем получить аватарку пользователя из user_bot_data
            let userResult = await pool.query(
                'SELECT avatar_url FROM user_bot_data WHERE user_id = $1 AND project_id = $2',
                [userId, projectId]
            );
            avatarUrl = userResult.rows[0]?.avatar_url || null;
            
            // Если не найдено, пробуем bot_users (для старых записей)
            if (!avatarUrl) {
                userResult = await pool.query(
                    'SELECT avatar_url FROM bot_users WHERE user_id = $1',
                    [userId]
                );
                avatarUrl = userResult.rows[0]?.avatar_url || null;
            }
        }

        await pool.end();

        if (!avatarUrl) {
            res.status(404).json({ message: "Аватарка не найдена" });
            return;
        }

        // Обрабатываем разные форматы avatarUrl
        let telegramFileUrl: string;
        const telegramPrefix = `https://api.telegram.org/file/bot${defaultToken.token}/`;
        
        if (avatarUrl.startsWith(telegramPrefix)) {
            telegramFileUrl = avatarUrl;
        } else if (avatarUrl.startsWith('https://')) {
            // Другой HTTPS URL, используем как есть
            telegramFileUrl = avatarUrl;
        } else {
            // Относительный путь, добавляем префикс
            telegramFileUrl = telegramPrefix + avatarUrl;
        }
        
        const response = await fetchWithProxy(telegramFileUrl);

        if (!response.ok) {
            res.status(404).json({ message: "Не удалось получить аватарку" });
            return;
        }

        res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error("Ошибка получения аватарки:", error);
        res.status(500).json({ message: "Не удалось получить аватарку" });
    }
}
