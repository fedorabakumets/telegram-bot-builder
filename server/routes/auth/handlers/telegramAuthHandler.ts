/**
 * @fileoverview Хендлер авторизации через Telegram
 *
 * Этот модуль предоставляет функцию для обработки данных
 * авторизации от виджета Telegram Login.
 *
 * @module auth/handlers/telegramAuthHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { regenerateSession, saveSession } from "../utils/sessionUtils";

/**
 * Обрабатывает данные авторизации от Telegram
 *
 * @function handleTelegramAuth
 * @param {Request} req - Объект запроса
 * @param {Response} res - Объект ответа
 * @returns {Promise<void>}
 */
export async function handleTelegramAuth(req: Request, res: Response): Promise<void> {
    try {
        const { id, first_name, last_name, username, photo_url, auth_date } = req.body;

        if (!id) {
            res.status(400).json({
                success: false,
                error: "User ID обязателен"
            });
            return;
        }

        const userData = await storage.getTelegramUserOrCreate({
            id,
            firstName: first_name,
            lastName: last_name,
            username,
            photoUrl: photo_url,
            authDate: auth_date ? parseInt(auth_date.toString()) : undefined
        });

        if (!req.session) {
            res.status(500).json({
                success: false,
                error: "Сессия не инициализирована"
            });
            return;
        }

        await regenerateSession(req);
        req.session.telegramUser = userData;
        await saveSession(req);

        console.log(`✅ Telegram auth successful for user: ${first_name} (@${username}) - Session SAVED with ID: ${userData.id}`);

        res.json({
            success: true,
            message: "Авторизация успешна",
            user: userData
        });
    } catch (error: any) {
        console.error("Telegram auth error:", error);
        res.status(500).json({
            success: false,
            error: "Ошибка авторизации"
        });
    }
}
