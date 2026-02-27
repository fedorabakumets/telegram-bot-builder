/**
 * @fileoverview Хендлер получения статистики ID пользователей
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение статистики по ID пользователей.
 *
 * @module userIds/handlers/getUserIdsStatsHandler
 */

import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { getUserIdsStats } from '../../handlers/user-ids-handler';

/**
 * Обрабатывает запрос на получение статистики
 *
 * @function handleGetUserIdsStats
 * @param {Pool} dbPool - Пул подключений к БД
 * @param {Request} _req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function handleGetUserIdsStats(
    dbPool: Pool,
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const stats = await getUserIdsStats(dbPool);
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
