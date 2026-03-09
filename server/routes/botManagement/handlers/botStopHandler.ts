/**
 * @fileoverview Хендлер остановки бота
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на остановку бота для указанного проекта.
 *
 * @module botManagement/handlers/botStopHandler
 */

import type { Request, Response } from 'express';
import { stopBot } from '../../../bots/stopBot';

/**
 * Обрабатывает запрос на остановку бота
 *
 * @function handleBotStop
 * @param {Request} req - Объект запроса Express
 * @param {Response} res - Объект ответа Express
 * @returns {Promise<void>}
 *
 * @description
 * Останавливает бота с указанным идентификатором токена.
 * Проверяет наличие tokenId в теле запроса.
 */
export async function handleBotStop(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const { tokenId } = req.body;

        if (!tokenId) {
            res.status(400).json({ message: "Требуется ID токена" });
            return;
        }

        const result = await stopBot(projectId, tokenId);
        if (result.success) {
            res.json({ message: "Бот успешно остановлен" });
        } else {
            res.status(500).json({ message: result.error || "Не удалось остановить бота" });
        }
    } catch (error) {
        res.status(500).json({ message: "Не удалось остановить бота" });
    }
}
