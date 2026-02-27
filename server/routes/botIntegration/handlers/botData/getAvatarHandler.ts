/**
 * @fileoverview Хендлер получения аватарки пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение аватарки пользователя через прокси.
 *
 * @module botIntegration/handlers/botData/getAvatarHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на получение аватарки пользователя
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

        const userResult = await pool.query(
            'SELECT avatar_url FROM bot_users WHERE user_id = $1',
            [userId]
        );

        await pool.end();

        if (!userResult.rows.length || !userResult.rows[0].avatar_url) {
            res.status(404).json({ message: "Аватарка не найдена" });
            return;
        }

        const fileUrl = userResult.rows[0].avatar_url;
        const filePath = fileUrl.replace(`https://api.telegram.org/file/bot${defaultToken.token}/`, '');

        const telegramFileUrl = `https://api.telegram.org/file/bot${defaultToken.token}/${filePath}`;
        const response = await fetch(telegramFileUrl);

        if (!response.ok) {
            res.status(404).json({ message: "Не удалось получить аватарку" });
            return;
        }

        res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error("Error fetching avatar:", error);
        res.status(500).json({ message: "Не удалось получить аватарку" });
    }
}
