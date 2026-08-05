/**
 * @fileoverview Хендлер авторизации через Telegram Login Widget
 *
 * Создаёт/обновляет пользователя, устанавливает session cookie.
 * Поддерживает смену аккаунта (regenerateSession) и верификацию id_token.
 *
 * @module auth/handlers/telegramAuthHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { regenerateSession, saveSession } from "../utils/sessionUtils";
import { verifyTelegramIdToken } from "../utils/telegramJwks";
import { isStrictAuthMode } from "../utils/isStrictAuthMode";

/**
 * Обрабатывает данные авторизации от Telegram.
 * После входа мигрирует гостевые проекты сессии к пользователю.
 * Повторный вызов с другим id = смена аккаунта (switched: true).
 *
 * @param req - Объект запроса (тело: id, first_name, ..., id_token?)
 * @param res - Объект ответа
 * @returns Promise без значения
 */
export async function handleTelegramAuth(req: Request, res: Response): Promise<void> {
    try {
        const { id, first_name, last_name, username, photo_url, auth_date, id_token } = req.body;

        if (!id) {
            res.status(400).json({ success: false, error: "User ID обязателен" });
            return;
        }

        const strict = isStrictAuthMode();

        if (strict && !id_token) {
            res.status(401).json({
                success: false,
                error: "Требуется id_token для входа",
            });
            return;
        }

        if (id_token) {
            const verified = await verifyTelegramIdToken(id_token);
            if (!verified) {
                res.status(401).json({ success: false, error: "Невалидный id_token" });
                return;
            }
            if (String(verified.sub) !== String(id)) {
                res.status(401).json({
                    success: false,
                    error: "id_token не соответствует user id",
                });
                return;
            }
        }

        const userData = await storage.getTelegramUserOrCreate({
            id,
            firstName: first_name,
            lastName: last_name,
            username,
            photoUrl: photo_url,
            authDate: auth_date ? parseInt(auth_date.toString()) : undefined,
        });

        if (!req.session) {
            res.status(500).json({ success: false, error: "Сессия не инициализирована" });
            return;
        }

        const existingUserId = req.session.telegramUser?.id;
        const isSameUser = existingUserId && Number(existingUserId) === Number(userData.id);
        const isGuestSession = !existingUserId;
        let switched = false;

        if (isSameUser || isGuestSession) {
            const oldSessionId = isGuestSession ? req.session.id : null;
            req.session.telegramUser = userData;
            await saveSession(req);

            if (oldSessionId) {
                await storage.migrateGuestProjects(oldSessionId, userData.id);
            }
        } else {
            switched = true;
            const oldSessionId = req.session.id;
            await regenerateSession(req);
            req.session.telegramUser = userData;
            await saveSession(req);

            if (oldSessionId) {
                await storage.migrateGuestProjects(oldSessionId, userData.id);
            }
        }

        console.log(
            `✅ Telegram авторизация: ${first_name} (@${username}), ID: ${userData.id}` +
                (switched ? " [switch]" : ""),
        );

        res.json({
            success: true,
            message: switched ? "Аккаунт переключён" : "Авторизация успешна",
            user: userData,
            switched,
        });
    } catch (error: unknown) {
        console.error("Ошибка авторизации через Telegram:", error);
        res.status(500).json({ success: false, error: "Ошибка авторизации" });
    }
}
