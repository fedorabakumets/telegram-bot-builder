/**
 * @fileoverview Хендлер удаления ID пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на удаление ID пользователя из базы.
 *
 * @module userIds/handlers/deleteUserIdHandler
 */

import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { deleteUserId } from '../../../handlers/user-ids-handler';

/**
 * Обрабатывает запрос на удаление ID
 *
 * @function handleDeleteUserId
 * @param {Pool} dbPool - Пул подключений к БД
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function handleDeleteUserId(
    dbPool: Pool,
    req: Request,
    res: Response
): Promise<void> {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({ error: 'Неверный ID' });
            return;
        }

        const deleted = await deleteUserId(dbPool, id);

        if (!deleted) {
            res.status(404).json({ error: 'ID не найден' });
            return;
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
