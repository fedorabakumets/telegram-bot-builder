/**
 * @fileoverview Хендлер получения пользователя Telegram
 *
 * Этот модуль предоставляет функцию для получения информации
 * о пользователе по его ID.
 *
 * @module auth/handlers/getUserHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";

/**
 * Обрабатывает запрос на получение пользователя
 *
 * @function handleGetUser
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function handleGetUser(req: Request, res: Response): Promise<void> {
    try {
        const userId = parseInt(req.params.id);

        if (!userId) {
            res.status(400).json({
                success: false,
                error: "Требуется ID пользователя"
            });
            return;
        }

        const user = await storage.getTelegramUser(userId);

        if (!user) {
            res.status(404).json({
                success: false,
                error: "Пользователь не найден"
            });
            return;
        }

        res.json({
            success: true,
            user
        });
    } catch (error: any) {
        console.error("Get telegram user error:", error);
        res.status(500).json({
            success: false,
            error: "Ошибка получения пользователя"
        });
    }
}
