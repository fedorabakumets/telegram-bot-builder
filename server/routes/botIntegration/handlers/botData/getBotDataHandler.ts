/**
 * @fileoverview Хендлер получения данных бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение данных бота из таблицы bot_tokens.
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

        // Получаем данные бота из bot_tokens (где хранится bot_photo_url)
        const result = await pool.query(
            `SELECT 
                id,
                bot_photo_url AS "avatarUrl",
                bot_username AS "userName",
                bot_first_name AS "firstName",
                bot_description AS "description",
                bot_short_description AS "shortDescription"
            FROM bot_tokens
            WHERE id = $1`,
            [defaultToken.id]
        );

        await pool.end();

        if (!result.rows.length) {
            res.json(null);
            return;
        }

        const botData = result.rows[0];
        
        // Форматируем в формат UserBotData для совместимости
        res.json({
            id: botId,
            userId: botId,
            avatarUrl: botData.avatarUrl,
            userName: botData.userName,
            firstName: botData.firstName,
            lastName: null,
            userData: null,
            isActive: true,
            isPremium: false,
            isBlocked: false,
            isBot: true,
            registeredAt: null,
            createdAt: null,
            lastInteraction: null,
            interactionCount: 0
        });
    } catch (error) {
        console.error("Ошибка получения данных бота:", error);
        res.status(500).json({ message: "Не удалось получить данные бота" });
    }
}
