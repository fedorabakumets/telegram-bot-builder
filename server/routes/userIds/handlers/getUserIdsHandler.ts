/**
 * @fileoverview Хендлер получения списка ID пользователей
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на получение списка ID пользователей.
 *
 * @module userIds/handlers/getUserIdsHandler
 */

import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { getUserIds } from '../../../handlers/user-ids-handler';

/**
 * Обрабатывает запрос на получение списка ID
 *
 * @function handleGetUserIds
 * @param {Pool} dbPool - Пул подключений к БД
 * @param {Request} _req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function handleGetUserIds(
    dbPool: Pool,
    _req: Request,
    res: Response
): Promise<void> {
    try {
        const items = await getUserIds(dbPool);
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
