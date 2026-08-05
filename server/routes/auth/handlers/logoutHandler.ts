/**
 * @fileoverview Хендлер выхода из Studio-сессии
 * @module auth/handlers/logoutHandler
 */

import type { Request, Response } from "express";
import { destroySession } from "../utils/sessionUtils";
import { shouldUseSecureSessionCookie } from "../../../utils/resolveSessionCookie";

/** Имя cookie express-session по умолчанию */
const SESSION_COOKIE_NAME = "connect.sid";

/**
 * Уничтожает серверную сессию и очищает session cookie.
 *
 * @param req - Объект запроса Express
 * @param res - Объект ответа Express
 * @returns Promise без значения
 */
export async function handleLogout(req: Request, res: Response): Promise<void> {
    try {
        await destroySession(req);

        const secure = shouldUseSecureSessionCookie();
        res.clearCookie(SESSION_COOKIE_NAME, {
            path: "/",
            httpOnly: true,
            secure,
            sameSite: secure ? "none" : "lax",
        });

        res.json({ success: true, message: "Выход выполнен" });
    } catch (error) {
        console.error("Ошибка POST /api/auth/logout:", error);
        res.status(500).json({ success: false, error: "Ошибка выхода" });
    }
}
