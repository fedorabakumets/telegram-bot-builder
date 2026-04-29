/**
 * @fileoverview Хендлер авторизации через Telegram
 *
 * Этот модуль предоставляет функцию для обработки данных
 * авторизации от нового Telegram Login JS API.
 * Поддерживает опциональную верификацию id_token (JWT) через JWKS.
 *
 * @module auth/handlers/telegramAuthHandler
 */

import type { Request, Response } from "express";
import { storage } from "../../../storages/storage";
import { regenerateSession, saveSession } from "../utils/sessionUtils";
import { verifyTelegramIdToken } from "../utils/telegramJwks";

/**
 * Обрабатывает данные авторизации от Telegram
 * После входа мигрирует гостевые проекты сессии к пользователю
 *
 * @param req - Объект запроса (тело: id, first_name, last_name, username, photo_url, auth_date, id_token?)
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function handleTelegramAuth(req: Request, res: Response): Promise<void> {
    try {
        const { id, first_name, last_name, username, photo_url, auth_date, id_token } = req.body;

        if (!id) {
            res.status(400).json({ success: false, error: "User ID обязателен" });
            return;
        }

        // Верифицируем id_token если он присутствует (новый OIDC flow)
        if (id_token) {
            const valid = await verifyTelegramIdToken(id_token);
            if (!valid) {
                res.status(401).json({ success: false, error: "Невалидный id_token" });
                return;
            }
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
            res.status(500).json({ success: false, error: "Сессия не инициализирована" });
            return;
        }

        const existingUserId = req.session.telegramUser?.id;
        const isSameUser = existingUserId && Number(existingUserId) === Number(userData.id);

        console.log(`[auth] existingUserId=${existingUserId} newId=${userData.id} isSameUser=${isSameUser} sessionId=${req.session.id}`);

        if (isSameUser) {
            // Тот же пользователь — обновляем данные без смены session ID.
            // Регенерация не нужна: браузер уже имеет правильный cookie,
            // смена ID вызовет race condition между Set-Cookie и следующим запросом.
            req.session.telegramUser = userData;
            await saveSession(req);
            console.log(`[auth] same user — session updated, id unchanged: ${req.session.id}`);
        } else {
            // Новый пользователь или смена аккаунта — регенерируем для безопасности
            const oldSessionId = req.session.id;
            await regenerateSession(req);
            req.session.telegramUser = userData;
            await saveSession(req);
            console.log(`[auth] new user — session regenerated: ${oldSessionId} → ${req.session.id}`);

            if (oldSessionId) {
                await storage.migrateGuestProjects(oldSessionId, userData.id);
            }
        }

        console.log(`✅ Telegram авторизация: ${first_name} (@${username}), ID: ${userData.id}`);

        res.json({ success: true, message: "Авторизация успешна", user: userData });
    } catch (error: any) {
        console.error("Ошибка авторизации через Telegram:", error);
        res.status(500).json({ success: false, error: "Ошибка авторизации" });
    }
}
