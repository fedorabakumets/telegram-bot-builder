/**
 * @fileoverview Хендлер получения данных бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение данных бота из таблицы bot_users.
 *
 * @module botIntegration/handlers/botData/getBotDataHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../../storages/storage";

/**
 * Обрабатывает запрос на получение данных бота
 *
 * @function getBotDataHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function getBotDataHandler(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.projectId);

        if (isNaN(projectId)) {
            res.status(400).json({ message: "Неверный ID проекта" });
            return;
        }

        const defaultToken = await storage.getDefaultBotToken(projectId);
        if (!defaultToken) {
            res.json(null);
            return;
        }

        const botId = defaultToken.token.split(':')[0];

        const { Pool } = await import('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        const result = await pool.query(
            'SELECT * FROM bot_users WHERE user_id = $1',
            [botId]
        );

        await pool.end();

        if (!result.rows.length) {
            res.json(null);
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching bot data:", error);
        res.status(500).json({ message: "Не удалось получить данные бота" });
    }
}
