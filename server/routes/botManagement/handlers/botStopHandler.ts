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
 * Нормализует tokenId из тела запроса.
 * Принимает число, числовую строку или строку вида "token_42" — возвращает число.
 * @param raw - Сырое значение tokenId из body
 * @returns Числовой ID или undefined если не удалось распарсить
 */
function parseTokenId(raw: unknown): number | undefined {
    if (typeof raw === 'number' && !isNaN(raw)) return raw;
    if (typeof raw === 'string') {
        const match = raw.match(/(\d+)$/);
        if (match) {
            const n = parseInt(match[1], 10);
            return isNaN(n) ? undefined : n;
        }
    }
    return undefined;
}

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
 * Поддерживает tokenId как число, строку "42" или "token_42".
 */
export async function handleBotStop(req: Request, res: Response): Promise<void> {
    try {
        const projectId = parseInt(req.params.id);
        const tokenId = parseTokenId(req.body.tokenId);

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
