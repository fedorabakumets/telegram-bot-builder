/**
 * @fileoverview Хендлер текущего пользователя Studio-сессии
 * @module auth/handlers/meHandler
 */

import type { Request, Response } from "express";

/**
 * Возвращает пользователя из session cookie без сайд-эффектов.
 * При отсутствии сессии или telegramUser отвечает `{ user: null }`.
 *
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @returns Promise без значения
 */
export async function handleMe(req: Request, res: Response): Promise<void> {
    try {
        const user = req.session?.telegramUser ?? null;
        res.json({ user });
    } catch (error) {
        console.error("Ошибка GET /api/auth/me:", error);
        res.status(500).json({ user: null, error: "Ошибка чтения сессии" });
    }
}
