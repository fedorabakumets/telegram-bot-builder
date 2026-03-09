/**
 * @fileoverview Хендлер настроек генерации комментариев
 *
 * Этот модуль предоставляет функцию для обработки запросов
 * на обновление настроек генерации комментариев.
 *
 * @module projectRoutes/handlers/settingsHandler
 */

import type { Request, Response } from "express";

/**
 * Обрабатывает запрос на обновление настроек генерации комментариев
 *
 * @function updateCommentsSettingsHandler
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function updateCommentsSettingsHandler(req: Request, res: Response): Promise<void> {
    try {
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
            res.status(400).json({ message: "Неверное значение enabled" });
            return;
        }

        process.env.BOTCRAFT_COMMENTS_GENERATION = enabled ? 'true' : 'false';

        res.json({
            success: true,
            message: `Генерация комментариев ${enabled ? 'включена' : 'отключена'}`
        });
    } catch (error) {
        console.error("❌ Ошибка обновления настроек генерации комментариев:", error);
        res.status(500).json({
            message: "Не удалось обновить настройки генерации комментариев",
            error: String(error)
        });
    }
}
