/**
 * @fileoverview Хендлер добавления ID пользователя
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на добавление ID пользователя в базу.
 *
 * @module userIds/handlers/addUserIdHandler
 */

import type { Request, Response } from 'express';
import { Pool } from 'pg';
import { addUserId } from '../../../handlers/user-ids-handler';

/**
 * Обрабатывает запрос на добавление ID
 *
 * @function handleAddUserId
 * @param {Pool} dbPool - Пул подключений к БД
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function handleAddUserId(
    dbPool: Pool,
    req: Request,
    res: Response
): Promise<void> {
    try {
        const { userId, source } = req.body;

        if (!userId || typeof userId !== 'string') {
            console.error('[UserIDs] Неверный userId:', userId);
            res.status(400).json({ error: 'Требуется userId' });
            return;
        }

        console.log('[UserIDs] Добавление ID:', userId, 'источник:', source || 'manual');

        const item = await addUserId(
            dbPool,
            userId,
            (source as 'manual' | 'import' | 'bot') || 'manual'
        );

        console.log('[UserIDs] Успешно добавлено:', item);
        res.status(201).json(item);
    } catch (error: any) {
        console.error('[UserIDs] Ошибка:', error.message);

        if (error.message === 'ID уже существует') {
            res.status(409).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: error.message });
    }
}
